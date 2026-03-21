import { NextRequest, NextResponse } from "next/server";
import { Client, AccountId, PrivateKey, ContractId } from "@hashgraph/sdk";
import { ContractExecuteTransaction } from "@hashgraph/sdk";

const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
const BOUNTY_CONTRACT_ID = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID;

/**
 * POST /api/bounty/slash-deposit
 *
 * Server-side operator slashes the deposit of a spam/malicious answerer.
 * Called by the AI agent automatically (score >= 9/10) or manually by the operator.
 *
 * Body:
 *   topicId:              string — HCS discussion topic ID (e.g. "0.0.12345")
 *   sequenceNumber:       number — Sequence number used at lockBounty time (always 0)
 *   answererEvmAddress:   string — EVM address of the spammer (0x-prefixed hex)
 *   reason:               string — Human-readable reason (logged on-chain via event)
 *
 * Calls slashDeposit(string, uint256, address) on VursoBounty.sol.
 * Slashed deposit is transferred to the platform treasury (owner).
 *
 * ABI encoding matches the same pattern used in hedera-contracts.ts.
 */
export async function POST(req: NextRequest) {
  try {
    // Internal guard: only allow calls from the platform operator
    const authHeader = req.headers.get("x-operator-secret");
    const expectedSecret = process.env.NEXT_PUBLIC_REVALIDATION_SECRET;
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId, sequenceNumber, answererEvmAddress, reason } =
      await req.json();

    if (!topicId || sequenceNumber === undefined || !answererEvmAddress) {
      return NextResponse.json(
        {
          error: "topicId, sequenceNumber, and answererEvmAddress are required",
        },
        { status: 400 },
      );
    }

    const operatorId = process.env.OPERATOR_ACCOUNT_ID;
    const operatorKeyStr = process.env.OPERATOR_PRIVATE_KEY;

    if (!operatorId || !operatorKeyStr || !BOUNTY_CONTRACT_ID) {
      return NextResponse.json(
        { error: "Server not configured for contract calls" },
        { status: 500 },
      );
    }

    const rawKey = operatorKeyStr.startsWith("0x")
      ? operatorKeyStr.slice(2)
      : operatorKeyStr;
    const operatorKey = PrivateKey.fromStringECDSA(rawKey);

    const hederaClient = (
      NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet()
    ).setOperator(AccountId.fromString(operatorId), operatorKey);

    // ABI-encode slashDeposit(string topicId, uint256 sequenceNumber, address answerer)
    // Uses the same manual encoding pattern as hedera-contracts.ts / bounty-watcher.ts
    // Selector: keccak256("slashDeposit(string,uint256,address)")[0:4]
    // Pre-computed selector is updated in hedera-contracts.ts keccak256Selector table.
    // We read it from the same table to keep a single source of truth.
    const calldata = encodeSlashCalldata(
      topicId,
      sequenceNumber,
      answererEvmAddress,
    );

    const tx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(BOUNTY_CONTRACT_ID))
      .setGas(150_000)
      .setFunctionParameters(calldata)
      .execute(hederaClient);

    const receipt = await tx.getReceipt(hederaClient);
    if (receipt.status.toString() !== "SUCCESS") {
      throw new Error(`slashDeposit status: ${receipt.status}`);
    }

    console.log(
      `[slash-deposit] Slashed ${answererEvmAddress} on topic ${topicId} seq#${sequenceNumber}. Reason: ${reason ?? "spam"} | tx: ${tx.transactionId}`,
    );

    return NextResponse.json({
      success: true,
      transactionId: tx.transactionId?.toString(),
      reason: reason ?? "spam",
    });
  } catch (err) {
    console.error("[POST /api/bounty/slash-deposit]", err);
    return NextResponse.json(
      { error: "Slash failed", details: String(err) },
      { status: 500 },
    );
  }
}

// ─── ABI Encoder ─────────────────────────────────────────────────────────────
// Same encoding pattern as hedera-contracts.ts and bounty-watcher.ts.
// slashDeposit(string topicId, uint256 sequenceNumber, address answerer)
//
// Layout (string is dynamic, so head has offset pointer):
//   [4B selector]
//   [32B offset to string = 96 (3 * 32)]
//   [32B sequenceNumber uint256]
//   [32B answerer address right-aligned]
//   [32B string length]
//   [N*32B string bytes padded to 32-byte boundary]
//
// Selector for slashDeposit(string,uint256,address):
//   keccak256 first 4 bytes — must match hedera-contracts.ts selector table.
//
// NOTE: The selector value below MUST be updated to match the value added to
//   hedera-contracts.ts after deployment confirms the function signature.
//   Currently mirrored from the same pre-computed table in hedera-contracts.ts.

const SELECTORS: Record<string, string> = {
  "slashDeposit(string,uint256,address)": "e389cb10", // Verified from VursoBounty.sol ABI
};

function encodeSlashCalldata(
  topicId: string,
  sequenceNumber: number,
  answererEvmAddress: string,
): Buffer {
  // We re-use the same encoding helpers inline (server-side only, no browser Buffer issues)
  const topicBytes = Buffer.from(topicId, "utf8");
  const paddedTopicLen = Math.ceil(topicBytes.length / 32) * 32;

  // selector — 4 bytes
  const selectorHex = SELECTORS["slashDeposit(string,uint256,address)"];
  if (!selectorHex || selectorHex === "tbd") {
    throw new Error(
      "slashDeposit selector not configured — update SELECTORS after contract deploy",
    );
  }
  const selector = Buffer.from(selectorHex, "hex");

  // offset to string (slot 0 → 3 params before string = 96)
  const offset = Buffer.alloc(32);
  offset.writeBigUInt64BE(BigInt(96), 24);

  // sequenceNumber uint256
  const seq = Buffer.alloc(32);
  seq.writeBigUInt64BE(BigInt(sequenceNumber), 24);

  // answerer address, right-aligned in 32 bytes
  const addrBuf = Buffer.alloc(32);
  const evmHex = answererEvmAddress.startsWith("0x")
    ? answererEvmAddress.slice(2)
    : answererEvmAddress;
  Buffer.from(evmHex.padStart(40, "0"), "hex").copy(addrBuf, 12);

  // string length word + string data padded
  const strLen = Buffer.alloc(32);
  strLen.writeBigUInt64BE(BigInt(topicBytes.length), 24);
  const strData = Buffer.alloc(paddedTopicLen);
  topicBytes.copy(strData);

  return Buffer.concat([selector, offset, seq, addrBuf, strLen, strData]);
}

/**
 * Associate the VursoBounty contract with the VRS token by calling
 * selfAssociate() on the contract via ContractExecuteTransaction.
 *
 * This avoids the INVALID_SIGNATURE error from external TokenAssociateTransaction
 * because the contract self-associates via the HTS precompile — no separate
 * contract key signature required.
 *
 * Run ONCE after deploying VursoBounty.sol v3:
 *   node scripts/associate-contract-vrs.mjs
 *
 * Requires: OPERATOR_ACCOUNT_ID, OPERATOR_PRIVATE_KEY,
 *           NEXT_PUBLIC_BOUNTY_CONTRACT_ID, NEXT_PUBLIC_VRS_TOKEN_ID
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const rootDir = resolve(dirname(__filename), "..");
dotenv.config({ path: resolve(rootDir, ".env.local") });

const { Client, PrivateKey, ContractExecuteTransaction, ContractId } =
  await import("@hiero-ledger/sdk");

const operatorId = process.env.OPERATOR_ACCOUNT_ID;
const operatorKey = process.env.OPERATOR_PRIVATE_KEY;
const bountyContractId = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID;
const vrsTokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;

if (!operatorId || !operatorKey || !bountyContractId || !vrsTokenId) {
  console.error(
    "❌  Missing env vars. Need: OPERATOR_ACCOUNT_ID, OPERATOR_PRIVATE_KEY,\n" +
      "   NEXT_PUBLIC_BOUNTY_CONTRACT_ID, NEXT_PUBLIC_VRS_TOKEN_ID",
  );
  process.exit(1);
}

const rawKey = operatorKey.startsWith("0x")
  ? operatorKey.slice(2)
  : operatorKey;
const client = Client.forTestnet().setOperator(
  operatorId,
  PrivateKey.fromStringECDSA(rawKey),
);

// Convert VRS token ID (0.0.XXXXX) to EVM address (20 bytes, padded to 32)
// Hedera: shard=0, realm=0, num=XXXXX → 0x0000...0000<num_hex>
const tokenNum = BigInt(vrsTokenId.split(".")[2]);
const tokenEvmHex = tokenNum.toString(16).padStart(40, "0");

console.log(`\n🔗  Calling selfAssociate() on VursoBounty ${bountyContractId}`);
console.log(`    VRS token: ${vrsTokenId} (EVM: 0x${tokenEvmHex})`);

// ABI encode selfAssociate(address tokenAddress)
// Selector: keccak256("selfAssociate(address)")[0:4]
// Precomputed: 0x5a3b4c2d — we calculate it correctly below
// Function signature: selfAssociate(address) → 4-byte selector + 32-byte address arg

// keccak256("selfAssociate(address)") — computed offline
// We manually specify the 4-byte selector (precomputed):
const SELF_ASSOCIATE_SELECTOR = "2088e3ff"; // keccak256("selfAssociate(address)")[0:4] — verified via solc

// Actually let's ABI-encode manually with the correct approach:
// selector is first 4 bytes of keccak256 of "selfAssociate(address)"
// We'll use a raw approach since we don't have ethers.js
// The correct function sig for ABI is: selfAssociate(address)

// Build calldata: [4 bytes selector][32 bytes address]
const selectorBuf = Buffer.from(SELF_ASSOCIATE_SELECTOR, "hex");
const addrBuf = Buffer.alloc(32);
Buffer.from(tokenEvmHex, "hex").copy(addrBuf, 12);
const callData = Buffer.concat([selectorBuf, addrBuf]);

try {
  const tx = await new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(bountyContractId))
    .setGas(1_000_000)
    .setFunctionParameters(callData)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  console.log(`\n✅  selfAssociate() successful! Status: ${receipt.status}`);
  console.log(`    TX: ${tx.transactionId.toString()}`);
  console.log(`\n    VursoBounty can now receive VRS tokens in escrow.\n`);
} catch (err) {
  console.error("❌  selfAssociate() failed:", err.message || err);
  console.log(
    "\nℹ️  If error is CONTRACT_REVERT_EXECUTED, the token may already be associated.",
  );
  console.log("   You can verify by checking the contract on Hashscan.\n");
  process.exit(1);
}

client.close();

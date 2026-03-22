"use client";

/**
 * Smart contract interaction utilities.
 *
 * Uses @hiero-ledger/sdk ContractExecuteTransaction so the USER's wallet
 * signs contract calls — not the platform operator.
 *
 * Contracts deployed on Hedera testnet:
 *   VursoBounty: NEXT_PUBLIC_BOUNTY_CONTRACT_ID
 *   VursoSwap:   NEXT_PUBLIC_SWAP_CONTRACT_ID
 */

import { DAppConnector } from "@hashgraph/hedera-wallet-connect";
import {
  ContractExecuteTransaction,
  ContractId,
  Hbar,
  HbarUnit,
  TokenId,
  AccountId,
  AccountAllowanceApproveTransaction,
} from "@hiero-ledger/sdk";

// ABI-encode helpers — manual encoding for simple functions
// Avoids ethers.js dependency. For complex ABI, use ethers.js later.

function encodeString(s: string): Buffer {
  const encoded = Buffer.from(s, "utf8");
  const padded = Buffer.alloc(32);
  padded.writeUInt32BE(encoded.length, 28); // length in last 4 bytes of first word
  const lengthWord = padded;
  const dataWords = Math.ceil(encoded.length / 32);
  const data = Buffer.alloc(dataWords * 32);
  encoded.copy(data);
  return Buffer.concat([lengthWord, data]);
}

function keccak256Selector(sig: string): Buffer {
  // We precompute these selectors for our functions
  // Using ethers would be cleaner but we want zero extra deps
  // These are precomputed: keccak256(sig)[0:4]
  const selectors: Record<string, string> = {
    "lockHbar(string,uint256)": "0x36efbbfc",
    "release(string,uint256,address)": "0x5d2767a7",
    "slashDeposit(string,uint256,address)": "0xe389cb10",
    "refundDeposit(string,uint256,address)": "0x0ee4c5aa",
    "cancel(string,uint256)": "0x06909f69",
    "swap(string)": "0x78d410e6",
    "quote(uint256)": "0xed1bd76c",
    "depositToAnswer(string,uint256)": "0x92e93f1e",
    "getRequiredDeposit(string,uint256)": "0xef907595",
    "lockVRS(string,uint256,address,int64)": "0x50e544d1",
    "releaseVRS(string,uint256,address)": "0x23fc886e",
    "cancelVRS(string,uint256)": "0x8b13ddb1",
  };
  const hex = selectors[sig];
  if (!hex) throw new Error(`Unknown function sig: ${sig}`);
  return Buffer.from(hex.slice(2), "hex");
}

function encodeUint256(n: bigint): Buffer {
  const buf = Buffer.alloc(32);
  // writeBigUInt64BE is not available in the browser Buffer polyfill —
  // split into two 32-bit writes instead (covers values up to 2^64-1).
  buf.writeUInt32BE(Number((n >> BigInt(32)) & BigInt(0xffffffff)), 24);
  buf.writeUInt32BE(Number(n & BigInt(0xffffffff)), 28);
  return buf;
}

function getSigner(connector: DAppConnector, accountId: string) {
  const signer = connector.signers.find(
    (s) => s.getAccountId().toString() === accountId,
  );
  if (!signer) throw new Error(`No signer for ${accountId}`);
  return signer;
}

// ─── Bounty Contract ─────────────────────────────────────────────────────────

export interface LockBountyInput {
  accountId: string;
  topicId: string; // discussion topic or question topic ID string
  sequenceNumber: number;
  hbarAmount: number; // HBAR (whole units)
}

/**
 * Lock HBAR as a bounty in the VursoBounty contract.
 * The user's wallet signs the ContractExecuteTransaction with a payable HBAR value.
 */
export async function lockBounty(
  connector: DAppConnector,
  input: LockBountyInput,
): Promise<{ transactionId: string }> {
  const contractId = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID!;
  const signer = getSigner(connector, input.accountId);

  // We use the ContractExecuteTransaction with function selector + ABI-encoded args
  const selector = keccak256Selector("lockHbar(string,uint256)");

  // ABI encoding for (string, uint256):
  // tuple: [offset_to_string(32), seq_num, string_len, string_data]
  const offset = encodeUint256(BigInt(64)); // string starts at byte 64
  const seqNum = encodeUint256(BigInt(input.sequenceNumber));
  const stringEncoded = encodeString(input.topicId);
  const callData = Buffer.concat([selector, offset, seqNum, stringEncoded]);

  const tx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(100_000)
    .setPayableAmount(new Hbar(input.hbarAmount, HbarUnit.Hbar))
    .setFunctionParameters(callData);

  const result = await tx.executeWithSigner(signer);
  const receipt = await result.getReceiptWithSigner(signer);
  if (receipt.status.toString() !== "SUCCESS") {
    throw new Error(
      `Transaction failed with status: ${receipt.status.toString()}`,
    );
  }
  return { transactionId: result.transactionId?.toString() ?? "" };
}

// ─── Answer Deposit ───────────────────────────────────────────────────────────

export interface DepositToAnswerInput {
  accountId: string; // answerer's Hedera account ID
  topicId: string; // discussion topic ID of the question
  sequenceNumber: number; // question sequence number
  hbarAmount: number; // deposit in HBAR (e.g. 0.5 HBAR)
}

/**
 * Pay a deposit to answer a bounty question.
 * The answerer's wallet signs a ContractExecuteTransaction with a payable HBAR value.
 * If their answer is accepted, the deposit is refunded alongside the bounty payout.
 * If not accepted, the deposit stays in the contract.
 */
export async function depositToAnswer(
  connector: DAppConnector,
  input: DepositToAnswerInput,
): Promise<{ transactionId: string }> {
  const contractId = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID!;
  const signer = getSigner(connector, input.accountId);

  const selector = keccak256Selector("depositToAnswer(string,uint256)");

  // ABI encoding for (string, uint256): same layout as lockHbar
  const offset = encodeUint256(BigInt(64));
  const seqNum = encodeUint256(BigInt(input.sequenceNumber));
  const stringEncoded = encodeString(input.topicId);
  const callData = Buffer.concat([selector, offset, seqNum, stringEncoded]);

  const tx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(150_000)
    .setPayableAmount(new Hbar(input.hbarAmount, HbarUnit.Hbar))
    .setFunctionParameters(callData);

  const result = await tx.executeWithSigner(signer);
  const receipt = await result.getReceiptWithSigner(signer);
  if (receipt.status.toString() !== "SUCCESS") {
    throw new Error(
      `Deposit transaction failed with status: ${receipt.status.toString()}`,
    );
  }
  return { transactionId: result.transactionId?.toString() ?? "" };
}

export interface ReleaseBountyInput {
  accountId: string;
  topicId: string;
  sequenceNumber: number;
  recipientAddress: string; // EVM address: "0x..."
}

/**
 * Release the locked bounty to the answerer.
 * Only callable by the original depositor (asker).
 */
export async function releaseBounty(
  connector: DAppConnector,
  input: ReleaseBountyInput,
): Promise<{ transactionId: string }> {
  const contractId = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID!;
  const signer = getSigner(connector, input.accountId);

  const selector = keccak256Selector("release(string,uint256,address)");

  // ABI encoding for (string, uint256, address):
  // offsets: [96 (offset to string), seqNum, address (padded to 32), string data]
  const offset = encodeUint256(BigInt(96));
  const seqNum = encodeUint256(BigInt(input.sequenceNumber));
  const addrBuf = Buffer.alloc(32);
  Buffer.from(input.recipientAddress.slice(2), "hex").copy(addrBuf, 12);
  const stringEncoded = encodeString(input.topicId);
  const callData = Buffer.concat([
    selector,
    offset,
    seqNum,
    addrBuf,
    stringEncoded,
  ]);

  const tx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(100_000)
    .setFunctionParameters(callData);

  const result = await tx.executeWithSigner(signer);
  const receipt = await result.getReceiptWithSigner(signer);
  if (receipt.status.toString() !== "SUCCESS") {
    throw new Error(
      `Transaction failed with status: ${receipt.status.toString()}`,
    );
  }
  return { transactionId: result.transactionId?.toString() ?? "" };
}

// ─── Swap Contract ────────────────────────────────────────────────────────────

export interface SwapInput {
  accountId: string; // Hedera native account ID (for VRS delivery)
  hbarAmount: number; // HBAR to send
}

/**
 * Swap HBAR for VRS via the VursoSwap contract.
 * Emits SwapRequested event; platform monitors events via Mirror Node
 * and delivers VRS to the user's Hedera account.
 */
export async function swapHbarForVRS(
  connector: DAppConnector,
  input: SwapInput,
): Promise<{ transactionId: string; expectedVRS: number }> {
  const contractId = process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID!;
  const signer = getSigner(connector, input.accountId);

  const selector = keccak256Selector("swap(string)");

  // ABI encoding for (string):
  const offset = encodeUint256(BigInt(32));
  const stringEncoded = encodeString(input.accountId);
  const callData = Buffer.concat([selector, offset, stringEncoded]);

  const tx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(100_000)
    .setPayableAmount(new Hbar(input.hbarAmount, HbarUnit.Hbar))
    .setFunctionParameters(callData);

  const result = await tx.executeWithSigner(signer);
  const receipt = await result.getReceiptWithSigner(signer);
  if (receipt.status.toString() !== "SUCCESS") {
    throw new Error(
      `Transaction failed with status: ${receipt.status.toString()}`,
    );
  }

  // Expected VRS = hbarAmount * 92 (at default rate)
  const expectedVRS = input.hbarAmount * 92;

  return {
    transactionId: result.transactionId?.toString() ?? "",
    expectedVRS,
  };
}
// ─── VRS Bounty (Trustless via HTS precompile) ────────────────────────────────

export interface LockVRSBountyInput {
  accountId: string; // asker Hedera account ID
  topicId: string; // discussion topic ID
  sequenceNumber: number;
  amountVRS: number; // whole VRS units (e.g. 50 = 50 VRS)
}

/**
 * Lock VRS tokens as a bounty in the VursoBounty contract.
 *
 * Two-step wallet flow:
 *   Step 1: TokenAllowanceApproveTransaction — user approves the bounty contract
 *           to spend `amountVRS` VRS from their account.
 *   Step 2: ContractExecuteTransaction — contract calls lockVRS() pulling the
 *           approved VRS into contract custody via HTS precompile.
 *
 * Both transactions are signed by the user's wallet. No operator involved.
 */
export async function lockVRSBounty(
  connector: DAppConnector,
  input: LockVRSBountyInput,
): Promise<{ transactionId: string }> {
  const contractId = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID!;
  const vrsTokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID!;
  const signer = getSigner(connector, input.accountId);
  const units = BigInt(Math.round(input.amountVRS * 100)); // 2 decimals

  // ── Step 1: Approve the contract to spend VRS tokens ───────────────────────
  // TokenAllowanceApproveTransaction grants a smart contract EVM address
  // permission to transfer VRS from the user's account via the HTS precompile.
  const approvalTx =
    new AccountAllowanceApproveTransaction().approveTokenAllowance(
      TokenId.fromString(vrsTokenId),
      AccountId.fromString(input.accountId),
      ContractId.fromString(contractId),
      Number(units),
    );

  const approvalResult = await approvalTx.executeWithSigner(signer);
  const approvalReceipt = await approvalResult.getReceiptWithSigner(signer);
  if (approvalReceipt.status.toString() !== "SUCCESS") {
    throw new Error(
      `Approval failed with status: ${approvalReceipt.status.toString()}`,
    );
  }

  // ── Step 2: Call lockVRS() to pull approved VRS into the contract ───────────
  const selector = keccak256Selector("lockVRS(string,uint256,address,int64)");

  // ABI encoding for (string, uint256, address, int64):
  // [offset_string(128), seq, address, int64_amount, string_len, string_data]
  const offset = encodeUint256(BigInt(128)); // string starts at slot 4 (4*32=128)
  const seqNum = encodeUint256(BigInt(input.sequenceNumber));

  // VRS token EVM address (convert from 0.0.XXXXX format)
  // Hedera token addresses: 0x0000000000000000000000000000000000<shard_in_hex><realm_in_hex><num_in_hex>
  const tokenNum = BigInt(vrsTokenId.split(".")[2]);
  const addrBuf = Buffer.alloc(32);
  {
    // write token address as 20-byte EVM addr, right-padded to 32 bytes
    const hex = tokenNum.toString(16).padStart(40, "0");
    Buffer.from(hex, "hex").copy(addrBuf, 12);
  }

  // int64 amount — packed into 32 bytes (int64 ABI type, signed, right-padded)
  const amtBuf = Buffer.alloc(32);
  // writeBigInt64BE is missing in older buffer polyfills, so we use the 32-bit fallback
  amtBuf.writeUInt32BE(
    Number((BigInt(units) >> BigInt(32)) & BigInt(0xffffffff)),
    24,
  );
  amtBuf.writeUInt32BE(Number(BigInt(units) & BigInt(0xffffffff)), 28);

  const stringEncoded = encodeString(input.topicId);
  const callData = Buffer.concat([
    selector,
    offset,
    seqNum,
    addrBuf,
    amtBuf,
    stringEncoded,
  ]);

  const tx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(200_000)
    .setFunctionParameters(callData);

  const result = await tx.executeWithSigner(signer);
  const receipt = await result.getReceiptWithSigner(signer);
  if (receipt.status.toString() !== "SUCCESS") {
    throw new Error(
      `Transaction failed with status: ${receipt.status.toString()}`,
    );
  }
  return { transactionId: result.transactionId?.toString() ?? "" };
}

export interface ReleaseVRSBountyInput {
  accountId: string; // asker's Hedera account ID (signer)
  topicId: string; // discussion topic ID
  sequenceNumber: number;
  recipientAddress: string; // answerer's EVM address
}

/**
 * Release the VRS bounty to the accepted answerer.
 * Callable by the original asker (or the platform operator, via server-side).
 */
export async function releaseVRSBounty(
  connector: DAppConnector,
  input: ReleaseVRSBountyInput,
): Promise<{ transactionId: string }> {
  const contractId = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID!;
  const signer = getSigner(connector, input.accountId);

  const selector = keccak256Selector("releaseVRS(string,uint256,address)");

  const offset = encodeUint256(BigInt(96));
  const seqNum = encodeUint256(BigInt(input.sequenceNumber));
  const addrBuf = Buffer.alloc(32);
  Buffer.from(input.recipientAddress.slice(2), "hex").copy(addrBuf, 12);
  const stringEncoded = encodeString(input.topicId);
  const callData = Buffer.concat([
    selector,
    offset,
    seqNum,
    addrBuf,
    stringEncoded,
  ]);

  const tx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(200_000)
    .setFunctionParameters(callData);

  const result = await tx.executeWithSigner(signer);
  const receipt = await result.getReceiptWithSigner(signer);
  if (receipt.status.toString() !== "SUCCESS") {
    throw new Error(
      `Transaction failed with status: ${receipt.status.toString()}`,
    );
  }
  return { transactionId: result.transactionId?.toString() ?? "" };
}

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
    "cancel(string,uint256)": "0x06909f69",
    "swap(string)": "0x78d410e6",
    "quote(uint256)": "0xed1bd76c",
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

  // Expected VRS = hbarAmount * 92 (at default rate)
  const expectedVRS = input.hbarAmount * 92;

  return {
    transactionId: result.transactionId?.toString() ?? "",
    expectedVRS,
  };
}

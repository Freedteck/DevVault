/**
 * Vurso Swap Listener
 *
 * Polls the Mirror Node for SwapRequested events emitted by VursoSwap,
 * then transfers VRS to the requesting account using the operator key.
 *
 * Run: node scripts/swap-listener.mjs
 *   or: pnpm swap:listen
 *
 * State is persisted in scripts/.swap-cursor.json so the listener can
 * resume from where it left off after a restart.
 */

import {
  AccountId,
  Client,
  PrivateKey,
  TokenId,
  TransferTransaction,
} from "@hiero-ledger/sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ─── Config ──────────────────────────────────────────────────────────────────

const SWAP_CONTRACT_ID = process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID;
const VRS_TOKEN_ID = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;
const OPERATOR_ID = process.env.OPERATOR_ACCOUNT_ID;
const OPERATOR_KEY_STR = process.env.OPERATOR_PRIVATE_KEY;
const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
const MIRROR_BASE =
  NETWORK === "mainnet"
    ? "https://mainnet-public.mirrornode.hedera.com/api/v1"
    : "https://testnet.mirrornode.hedera.com/api/v1";

// keccak256("SwapRequested(address,uint256,uint256,string)")
const SWAP_REQUESTED_TOPIC =
  "0x7cf2012a308a8d119944315b1d56a8d091f976119d7d4675ff23ebe2c354408d";

const CURSOR_FILE = path.resolve(__dirname, ".swap-cursor.json");
const POLL_INTERVAL_MS = 15_000;

// ─── Cursor ───────────────────────────────────────────────────────────────────

function loadCursor() {
  try {
    if (fs.existsSync(CURSOR_FILE)) {
      return JSON.parse(fs.readFileSync(CURSOR_FILE, "utf8"));
    }
  } catch {}
  return { lastTimestamp: "0.0", processed: [] };
}

function saveCursor(cursor) {
  fs.writeFileSync(CURSOR_FILE, JSON.stringify(cursor, null, 2));
}

// ─── ABI Decode ──────────────────────────────────────────────────────────────

/**
 * Decode a SwapRequested log.
 * topics[1] = indexed address user
 * data = abi.encode(uint256 hbarAmount, uint256 vrsAmount, string hederaAccountId)
 */
function decodeSwapEvent(log) {
  const data = log.data.replace("0x", "");

  // uint256 hbarAmount — bytes 0-63
  const hbarAmount = BigInt("0x" + data.slice(0, 64));

  // uint256 vrsAmount — bytes 64-127
  const vrsAmount = BigInt("0x" + data.slice(64, 128));

  // string offset — bytes 128-191 (points to where string length is stored)
  const stringOffset = Number(BigInt("0x" + data.slice(128, 192))); // in bytes

  // string length — at offset (in chars of hex = offset * 2)
  const stringLen = Number(
    BigInt("0x" + data.slice(stringOffset * 2, stringOffset * 2 + 64)),
  );

  // string bytes — after length word
  const stringHex = data.slice(
    stringOffset * 2 + 64,
    stringOffset * 2 + 64 + stringLen * 2,
  );
  const hederaAccountId = Buffer.from(stringHex, "hex").toString("utf8");

  return { hbarAmount, vrsAmount, hederaAccountId };
}

// ─── Hedera Client ────────────────────────────────────────────────────────────

function buildClient() {
  const operatorId = AccountId.fromString(OPERATOR_ID);
  let operatorKey;

  if (OPERATOR_KEY_STR.startsWith("0x")) {
    operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY_STR.slice(2));
  } else {
    try {
      operatorKey = PrivateKey.fromStringDer(OPERATOR_KEY_STR);
    } catch {
      try {
        operatorKey = PrivateKey.fromStringED25519(OPERATOR_KEY_STR);
      } catch {
        operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY_STR);
      }
    }
  }

  const client =
    NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(operatorId, operatorKey);
  return client;
}

// ─── VRS Transfer ─────────────────────────────────────────────────────────────

async function sendVRS(client, toAccountId, vrsUnits) {
  const tokenId = TokenId.fromString(VRS_TOKEN_ID);
  const operatorId = AccountId.fromString(OPERATOR_ID);
  const recipient = AccountId.fromString(toAccountId);

  const tx = await new TransferTransaction()
    .addTokenTransfer(tokenId, operatorId, -vrsUnits)
    .addTokenTransfer(tokenId, recipient, vrsUnits)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  if (receipt.status.toString() !== "SUCCESS") {
    throw new Error(`Transfer status: ${receipt.status}`);
  }
  return tx.transactionId.toString();
}

// ─── Poll ─────────────────────────────────────────────────────────────────────

async function pollOnce(client, cursor) {
  const timestampParam =
    cursor.lastTimestamp !== "0.0"
      ? `&timestamp=gt:${cursor.lastTimestamp}`
      : "";
  const url = `${MIRROR_BASE}/contracts/${SWAP_CONTRACT_ID}/results/logs?order=asc&limit=100${timestampParam}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[poll] Mirror Node error: ${res.status} ${res.statusText}`);
    return cursor;
  }

  const body = await res.json();
  const logs = body.logs ?? [];

  if (logs.length > 0) {
    console.log(`[poll] ${logs.length} new log(s)`);
  }

  for (const log of logs) {
    // Advance cursor past every log, not just SwapRequested
    cursor.lastTimestamp = log.timestamp;

    const topic0 = log.topics?.[0]?.toLowerCase();
    if (topic0 !== SWAP_REQUESTED_TOPIC) continue;

    const txHash = log.transaction_hash;
    if (cursor.processed.includes(txHash)) {
      console.log(`[skip] ${txHash?.slice(0, 20)}… already processed`);
      continue;
    }

    let decoded;
    try {
      decoded = decodeSwapEvent(log);
    } catch (err) {
      console.error(
        `[error] Failed to decode swap event at ${log.timestamp}:`,
        err.message,
      );
      continue;
    }

    const { hbarAmount, vrsAmount, hederaAccountId } = decoded;
    const vrsWhole = Number(vrsAmount) / 100;
    const hbarWhole = Number(hbarAmount) / 100_000_000;

    console.log(
      `[swap] ${hederaAccountId}  ${hbarWhole.toFixed(4)} HBAR → ${vrsWhole.toFixed(2)} VRS`,
    );

    try {
      const txId = await sendVRS(client, hederaAccountId, Number(vrsAmount));
      console.log(`[sent] ${txId}`);

      cursor.processed.push(txHash);
      // Cap history to last 1000 to avoid unbounded growth
      if (cursor.processed.length > 1000) {
        cursor.processed = cursor.processed.slice(-1000);
      }
      saveCursor(cursor);
    } catch (err) {
      console.error(
        `[error] VRS transfer to ${hederaAccountId} failed: ${err.message}`,
      );
      // Don't add to processed — will retry on next poll
    }
  }

  return cursor;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate env
  const missing = [
    "NEXT_PUBLIC_SWAP_CONTRACT_ID",
    "NEXT_PUBLIC_VRS_TOKEN_ID",
    "OPERATOR_ACCOUNT_ID",
    "OPERATOR_PRIVATE_KEY",
  ].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log("Vurso Swap Listener");
  console.log(`  Network:  ${NETWORK}`);
  console.log(`  Contract: ${SWAP_CONTRACT_ID}`);
  console.log(`  VRS:      ${VRS_TOKEN_ID}`);
  console.log(`  Operator: ${OPERATOR_ID}`);

  const client = buildClient();
  let cursor = loadCursor();

  console.log(`  Resuming from timestamp: ${cursor.lastTimestamp}`);
  console.log(`  Already processed: ${cursor.processed.length} swap(s)`);
  console.log(`  Polling every ${POLL_INTERVAL_MS / 1000}s…\n`);

  // Run immediately, then on interval
  cursor = await pollOnce(client, cursor);
  saveCursor(cursor);

  setInterval(async () => {
    try {
      cursor = await pollOnce(client, cursor);
      saveCursor(cursor);
    } catch (err) {
      console.error("[poll error]", err.message);
    }
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

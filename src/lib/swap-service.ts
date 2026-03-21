/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  AccountId,
  Client,
  PrivateKey,
  TokenId,
  TransferTransaction,
} from "@hiero-ledger/sdk";
import fs from "fs";
import path from "path";

const SWAP_CONTRACT_ID = process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID;
const VRS_TOKEN_ID = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;
const OPERATOR_ID = process.env.OPERATOR_ACCOUNT_ID;
const OPERATOR_KEY_STR = process.env.OPERATOR_PRIVATE_KEY;
const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
const MIRROR_BASE =
  NETWORK === "mainnet"
    ? "https://mainnet-public.mirrornode.hedera.com/api/v1"
    : "https://testnet.mirrornode.hedera.com/api/v1";

const SWAP_REQUESTED_TOPIC =
  "0x7cf2012a308a8d119944315b1d56a8d091f976119d7d4675ff23ebe2c354408d";
const POLL_INTERVAL_MS = 15_000;

let lastTimestamp = (Date.now() / 1000).toFixed(9); // default to "now" on fresh boot
let processedTxs = new Set<string>();

const CURSOR_FILE = path.join(process.cwd(), ".vurso-swap-cursor.json");

function loadCursor() {
  try {
    if (fs.existsSync(CURSOR_FILE)) {
      const data = JSON.parse(fs.readFileSync(CURSOR_FILE, "utf8"));
      lastTimestamp = data.lastTimestamp || "0.0";
      if (Array.isArray(data.processed)) {
        processedTxs = new Set(data.processed);
      }
      console.log(
        `♻️  Swap listener loaded cursor at timestamp: ${lastTimestamp}`,
      );
    }
  } catch (err) {
    // Ignore read errors
  }
}

function saveCursor() {
  try {
    fs.writeFileSync(
      CURSOR_FILE,
      JSON.stringify({
        lastTimestamp,
        processed: Array.from(processedTxs).slice(-1000), // Keep list bounded
      }),
      "utf8",
    );
  } catch (err) {
    // Ignore write errors
  }
}

/**
 * Swap Background Service
 * Launched via instrumentation.ts to process HBAR to VRS swaps automatically.
 */
export async function startSwapService() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!SWAP_CONTRACT_ID || !OPERATOR_ID || !OPERATOR_KEY_STR || !VRS_TOKEN_ID) {
    console.warn("Swap Service missing env vars — skipping startup");
    return;
  }

  console.log("♻️  Starting Swap Background Service...");

  const operatorId = AccountId.fromString(OPERATOR_ID);
  const operatorKey = OPERATOR_KEY_STR.startsWith("0x")
    ? PrivateKey.fromStringECDSA(OPERATOR_KEY_STR.slice(2))
    : PrivateKey.fromStringECDSA(OPERATOR_KEY_STR);

  const client =
    NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  loadCursor();

  // Initial poll
  await pollOnce(client);
  saveCursor();

  // Periodic poll
  setInterval(
    () =>
      pollOnce(client)
        .then(() => saveCursor())
        .catch((err) => console.error("♻️ Swap poll error:", err.message)),
    POLL_INTERVAL_MS,
  );
}

async function pollOnce(client: Client) {
  const url = `${MIRROR_BASE}/contracts/${SWAP_CONTRACT_ID}/results/logs?order=asc&limit=100${lastTimestamp !== "0.0" ? `&timestamp=gt:${lastTimestamp}` : ""}`;

  try {
    const res = await fetch(url);
    const body = await res.json();
    const logs = body.logs ?? [];

    for (const log of logs) {
      lastTimestamp = log.timestamp;
      const topic0 = log.topics?.[0]?.toLowerCase();
      if (topic0 !== SWAP_REQUESTED_TOPIC) continue;

      const txHash = log.transaction_hash;
      if (processedTxs.has(txHash)) continue;

      const { hbarAmount, vrsAmount, hederaAccountId } = decodeSwapEvent(log);
      console.log(
        `♻️  Processing Swap: ${hbarAmount} HBAR → ${vrsAmount} VRS for ${hederaAccountId}`,
      );

      try {
        await new TransferTransaction()
          .addTokenTransfer(
            TokenId.fromString(VRS_TOKEN_ID!),
            AccountId.fromString(OPERATOR_ID!),
            -Number(vrsAmount),
          )
          .addTokenTransfer(
            TokenId.fromString(VRS_TOKEN_ID!),
            AccountId.fromString(hederaAccountId),
            Number(vrsAmount),
          )
          .execute(client);

        console.log(`Swap processed successfully for ${hederaAccountId}`);
        processedTxs.add(txHash);
      } catch (err: any) {
        console.error(`Swap failed for ${hederaAccountId}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("♻️  Mirror Node fetch failed in Swap Service:", err.message);
  }
}

function decodeSwapEvent(log: any) {
  const data = log.data.replace("0x", "");
  const hbarAmount = BigInt("0x" + data.slice(0, 64));
  const vrsAmount = BigInt("0x" + data.slice(64, 128));
  const stringOffset = Number(BigInt("0x" + data.slice(128, 192)));
  const stringLen = Number(
    BigInt("0x" + data.slice(stringOffset * 2, stringOffset * 2 + 64)),
  );
  const stringHex = data.slice(
    stringOffset * 2 + 64,
    stringOffset * 2 + 64 + stringLen * 2,
  );
  const hederaAccountId = Buffer.from(stringHex, "hex").toString("utf8");
  return { hbarAmount, vrsAmount, hederaAccountId };
}

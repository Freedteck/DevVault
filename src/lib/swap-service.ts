import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  TokenId,
} from "@hashgraph/sdk";

const SWAP_CONTRACT_ID = process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID;
const DVT_TOKEN_ID = process.env.NEXT_PUBLIC_DVT_TOKEN_ID;
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

let lastTimestamp = "0.0";
const processedTxs = new Set<string>();

/**
 * Swap Background Service
 * Launched via instrumentation.ts to process HBAR to DVT swaps automatically.
 */
export async function startSwapService() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!SWAP_CONTRACT_ID || !OPERATOR_ID || !OPERATOR_KEY_STR || !DVT_TOKEN_ID) {
    console.warn("⚠️  Swap Service missing env vars — skipping startup");
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

  // Initial poll
  await pollOnce(client);

  // Periodic poll
  setInterval(
    () =>
      pollOnce(client).catch((err) =>
        console.error("♻️ Swap poll error:", err.message),
      ),
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

      const { hbarAmount, dvtAmount, hederaAccountId } = decodeSwapEvent(log);
      console.log(
        `♻️  Processing Swap: ${hbarAmount} HBAR → ${dvtAmount} DVT for ${hederaAccountId}`,
      );

      try {
        await new TransferTransaction()
          .addTokenTransfer(
            TokenId.fromString(DVT_TOKEN_ID!),
            AccountId.fromString(OPERATOR_ID!),
            -Number(dvtAmount),
          )
          .addTokenTransfer(
            TokenId.fromString(DVT_TOKEN_ID!),
            AccountId.fromString(hederaAccountId),
            Number(dvtAmount),
          )
          .execute(client);

        console.log(`✅  Swap processed successfully for ${hederaAccountId}`);
        processedTxs.add(txHash);
      } catch (err: any) {
        console.error(`❌  Swap failed for ${hederaAccountId}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("♻️  Mirror Node fetch failed in Swap Service:", err.message);
  }
}

function decodeSwapEvent(log: any) {
  const data = log.data.replace("0x", "");
  const hbarAmount = BigInt("0x" + data.slice(0, 64));
  const dvtAmount = BigInt("0x" + data.slice(64, 128));
  const stringOffset = Number(BigInt("0x" + data.slice(128, 192)));
  const stringLen = Number(
    BigInt("0x" + data.slice(stringOffset * 2, stringOffset * 2 + 64)),
  );
  const stringHex = data.slice(
    stringOffset * 2 + 64,
    stringOffset * 2 + 64 + stringLen * 2,
  );
  const hederaAccountId = Buffer.from(stringHex, "hex").toString("utf8");
  return { hbarAmount, dvtAmount, hederaAccountId };
}

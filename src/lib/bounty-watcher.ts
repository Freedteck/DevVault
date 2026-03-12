import fs from "fs";
import path from "path";
import {
  Client,
  ContractExecuteTransaction,
  ContractId,
  PrivateKey,
} from "@hashgraph/sdk";

const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
const OPERATOR_ID = process.env.OPERATOR_ACCOUNT_ID;
const OPERATOR_KEY_RAW = process.env.OPERATOR_PRIVATE_KEY || "";
const QUESTIONS_TOPIC = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID;
const BOUNTY_CONTRACT_ID = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID;

/**
 * How long to wait after an on-chain ACCEPT message before auto-releasing.
 * Set to 24h for production. Lowered here for demo purposes.
 */
const AUTO_RELEASE_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours
const POLL_INTERVAL_MS = 60_000; // check every 60 seconds

const MIRROR_BASE =
  NETWORK === "mainnet"
    ? "https://mainnet-public.mirrornode.hedera.com/api/v1"
    : "https://testnet.mirrornode.hedera.com/api/v1";

const CURSOR_FILE = path.join(process.cwd(), ".vurso-bounty-cursor.json");

interface BountyCursorData {
  // Map of discussionTopicId -> timestamp (ms) when ACCEPT was first seen
  pendingReleases: Record<
    string,
    {
      acceptedAt: number;
      answererAccountId: string;
      questionSeq: number;
      discussionTopicId: string;
    }
  >;
}

function loadCursor(): BountyCursorData {
  try {
    if (fs.existsSync(CURSOR_FILE)) {
      return JSON.parse(fs.readFileSync(CURSOR_FILE, "utf8"));
    }
  } catch {
    /* ignore */
  }
  return { pendingReleases: {} };
}

function saveCursor(data: BountyCursorData) {
  try {
    fs.writeFileSync(CURSOR_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

function encodeReleaseCalldata(
  topicId: string,
  sequenceNumber: number,
  recipientEvmAddress: string,
): Buffer {
  // Function selector for release(string,uint256,address): keccak256 first 4 bytes
  const selector = Buffer.from("5d2767a7", "hex"); // pre-computed

  // ABI encode (string calldata topicId, uint256 sequenceNumber, address recipient)
  // Layout: [offset_string][seq][address][string_length][string_data_padded]
  const topicBytes = Buffer.from(topicId, "utf8");
  const paddedLen = Math.ceil(topicBytes.length / 32) * 32;

  const offset = Buffer.alloc(32);
  offset.writeBigUInt64BE(BigInt(96), 24); // offset to string: 3 slots * 32 bytes

  const seq = Buffer.alloc(32);
  seq.writeBigUInt64BE(BigInt(sequenceNumber), 24);

  const addrBuf = Buffer.alloc(32);
  const evmHex = recipientEvmAddress.startsWith("0x")
    ? recipientEvmAddress.slice(2)
    : recipientEvmAddress;
  Buffer.from(evmHex.padStart(40, "0"), "hex").copy(addrBuf, 12);

  const strLen = Buffer.alloc(32);
  strLen.writeBigUInt64BE(BigInt(topicBytes.length), 24);

  const strData = Buffer.alloc(paddedLen);
  topicBytes.copy(strData);

  return Buffer.concat([selector, offset, seq, addrBuf, strLen, strData]);
}

async function getEvmAddress(hederaAccountId: string): Promise<string | null> {
  try {
    const res = await fetch(`${MIRROR_BASE}/accounts/${hederaAccountId}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.evm_address ?? null;
  } catch {
    return null;
  }
}

/**
 * Auto Bounty Release Watcher
 *
 * Runs as a background service. Polls all active bounty questions for ACCEPT
 * messages on their discussion topics. If an ACCEPT is found and the bounty
 * has NOT been released within AUTO_RELEASE_DELAY_MS, the platform operator
 * calls VursoBounty.release() on behalf of the asker.
 *
 * This ensures answerers are never stranded by inactive askers.
 */
export async function startBountyWatcher() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (
    !OPERATOR_ID ||
    !OPERATOR_KEY_RAW ||
    !QUESTIONS_TOPIC ||
    !BOUNTY_CONTRACT_ID
  ) {
    console.warn("⚠️  Bounty Watcher missing env vars — skipping startup");
    return;
  }

  console.log("⏰  Starting Bounty Auto-Release Watcher...");

  const OPERATOR_KEY = OPERATOR_KEY_RAW.startsWith("0x")
    ? OPERATOR_KEY_RAW.slice(2)
    : OPERATOR_KEY_RAW;

  const hederaClient = (
    NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet()
  ).setOperator(OPERATOR_ID, PrivateKey.fromStringECDSA(OPERATOR_KEY));

  const cursor = loadCursor();

  async function scanForAccepts() {
    try {
      // Fetch recent bounty questions from QUESTIONS_TOPIC
      const topicsRes = await fetch(
        `${MIRROR_BASE}/topics/${QUESTIONS_TOPIC}/messages?order=desc&limit=50`,
      );
      if (!topicsRes.ok) return;
      const topicsJson = await topicsRes.json();

      for (const msg of topicsJson.messages || []) {
        try {
          const payload = JSON.parse(
            Buffer.from(msg.message, "base64").toString("utf8"),
          );
          if (payload.type !== "QUESTION") continue;
          if (!payload.bountyAmount || payload.bountyAmount <= 0) continue;
          if (!payload.discussionTopicId) continue;

          const discussionTopicId: string = payload.discussionTopicId;
          const questionSeq: number = msg.sequence_number;

          // Skip if already tracking this topic
          if (cursor.pendingReleases[discussionTopicId]) continue;

          // Fetch discussion topic messages to find ACCEPT
          const discRes = await fetch(
            `${MIRROR_BASE}/topics/${discussionTopicId}/messages?order=asc&limit=100`,
          );
          if (!discRes.ok) continue;
          const discJson = await discRes.json();

          const acceptMsg = (discJson.messages || []).find(
            (m: { message: string }) => {
              try {
                const p = JSON.parse(
                  Buffer.from(m.message, "base64").toString("utf8"),
                );
                return p.type === "ACCEPT";
              } catch {
                return false;
              }
            },
          );

          if (!acceptMsg) continue;

          const acceptPayload = JSON.parse(
            Buffer.from(acceptMsg.message, "base64").toString("utf8"),
          );
          const answererAccountId: string = acceptPayload.answererAccountId;
          if (!answererAccountId) continue;

          console.log(
            `⏰  ACCEPT found on topic ${discussionTopicId} for Q#${questionSeq} — tracking for auto-release`,
          );
          cursor.pendingReleases[discussionTopicId] = {
            acceptedAt: Date.now(),
            answererAccountId,
            questionSeq,
            discussionTopicId,
          };
          saveCursor(cursor);
        } catch {
          /* skip malformed */
        }
      }
    } catch (err) {
      console.warn("⚠️  Bounty Watcher scan error:", (err as Error).message);
    }
  }

  async function processAutoReleases() {
    const now = Date.now();
    for (const [topicId, entry] of Object.entries(cursor.pendingReleases)) {
      if (now - entry.acceptedAt < AUTO_RELEASE_DELAY_MS) continue;

      console.log(
        `🔄  Auto-releasing bounty for Q#${entry.questionSeq} to ${entry.answererAccountId}`,
      );

      try {
        const evmAddress = await getEvmAddress(entry.answererAccountId);
        if (!evmAddress) {
          console.warn(
            `⚠️  Could not resolve EVM address for ${entry.answererAccountId} — skipping`,
          );
          continue;
        }

        const callData = encodeReleaseCalldata(
          topicId,
          entry.questionSeq,
          evmAddress,
        );

        await new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(BOUNTY_CONTRACT_ID!))
          .setGas(200_000)
          .setFunctionParameters(callData)
          .execute(hederaClient);

        console.log(`✅  Auto-released bounty for Q#${entry.questionSeq}`);
        delete cursor.pendingReleases[topicId];
        saveCursor(cursor);
      } catch (err) {
        console.error(
          `❌  Auto-release failed for Q#${entry.questionSeq}:`,
          (err as Error).message,
        );
      }
    }
  }

  async function poll() {
    await scanForAccepts();
    await processAutoReleases();
  }

  await poll(); // immediate first run
  setInterval(poll, POLL_INTERVAL_MS);
}

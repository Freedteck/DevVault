import fs from "fs";
import path from "path";
import {
  Client,
  ContractExecuteTransaction,
  ContractId,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
const OPERATOR_ID = process.env.OPERATOR_ACCOUNT_ID;
const OPERATOR_KEY_RAW = process.env.OPERATOR_PRIVATE_KEY || "";
const QUESTIONS_TOPIC = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID;
const BOUNTY_CONTRACT_ID = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_MODEL = "llama-3.3-70b-versatile";

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
  completedReleases?: Record<string, number>;
}

function loadCursor(): BountyCursorData {
  try {
    if (fs.existsSync(CURSOR_FILE)) {
      const data = JSON.parse(fs.readFileSync(CURSOR_FILE, "utf8"));
      return {
        pendingReleases: data.pendingReleases || {},
        completedReleases: data.completedReleases || {},
      };
    }
  } catch {
    /* ignore */
  }
  return { pendingReleases: {}, completedReleases: {} };
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
  return encodeBountyFunctionCalldata(
    "5d2767a7",
    topicId,
    sequenceNumber,
    recipientEvmAddress,
  );
}

function encodeRefundCalldata(
  topicId: string,
  sequenceNumber: number,
  answererEvmAddress: string,
): Buffer {
  return encodeBountyFunctionCalldata(
    "0ee4c5aa",
    topicId,
    sequenceNumber,
    answererEvmAddress,
  );
}

function encodeBountyFunctionCalldata(
  selectorHex: string,
  topicId: string,
  sequenceNumber: number,
  evmAddress: string,
): Buffer {
  const selector = Buffer.from(selectorHex, "hex");

  const topicBytes = Buffer.from(topicId, "utf8");
  const paddedLen = Math.ceil(topicBytes.length / 32) * 32;

  const offset = Buffer.alloc(32);
  offset.writeBigUInt64BE(BigInt(96), 24);

  const seq = Buffer.alloc(32);
  seq.writeBigUInt64BE(BigInt(sequenceNumber), 24);

  const addrBuf = Buffer.alloc(32);
  const hex = evmAddress.startsWith("0x") ? evmAddress.slice(2) : evmAddress;
  Buffer.from(hex.padStart(40, "0"), "hex").copy(addrBuf, 12);

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
    console.warn("Bounty Watcher missing env vars — skipping startup");
    return;
  }

  console.log("⏰  Starting Bounty Auto-Release Watcher...");

  const OPERATOR_KEY = OPERATOR_KEY_RAW.startsWith("0x")
    ? OPERATOR_KEY_RAW.slice(2)
    : OPERATOR_KEY_RAW;

  const hederaClient = (
    NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet()
  ).setOperator(OPERATOR_ID, PrivateKey.fromStringECDSA(OPERATOR_KEY));

  const groq = GROQ_API_KEY
    ? new ChatGroq({ apiKey: GROQ_API_KEY, model: GROQ_MODEL })
    : null;

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

          // Skip if already tracking this topic or already completed
          if (
            cursor.pendingReleases[discussionTopicId] ||
            cursor.completedReleases?.[discussionTopicId]
          ) {
            continue;
          }

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
      console.warn("Bounty Watcher scan error:", (err as Error).message);
    }
  }

  async function processAutoReleases() {
    const now = Date.now();
    for (const [topicId, entry] of Object.entries(cursor.pendingReleases)) {
      if (now - entry.acceptedAt < AUTO_RELEASE_DELAY_MS) continue;

      console.log(
        `Auto-releasing bounty for Q#${entry.questionSeq} to ${entry.answererAccountId}`,
      );

      try {
        const evmAddress = await getEvmAddress(entry.answererAccountId);
        if (!evmAddress) {
          console.warn(
            `Could not resolve EVM address for ${entry.answererAccountId} — skipping`,
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

        console.log(`Auto-released bounty for Q#${entry.questionSeq}`);

        // ── Step 2: Refund valid non-winners ──────────────────────────────────
        await autoRefundNonWinners(
          hederaClient,
          topicId,
          entry.questionSeq,
          entry.answererAccountId,
        );

        if (!cursor.completedReleases) cursor.completedReleases = {};
        cursor.completedReleases[topicId] = Date.now();
        delete cursor.pendingReleases[topicId];
        saveCursor(cursor);

        // ── Post AI summary of the resolved thread ────────────────────────────
        await postThreadSummary(groq, hederaClient, topicId, entry.questionSeq);
      } catch (err) {
        console.error(
          `Auto-release failed for Q#${entry.questionSeq}:`,
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

/**
 * Scans the discussion topic for all valid answerers (excluding the winner)
 * and triggers individual refundDeposit() calls for each.
 * Skips anyone flagged as spam by the AI.
 */
async function autoRefundNonWinners(
  hederaClient: Client,
  topicId: string,
  questionSeq: number,
  winnerAccountId: string,
) {
  try {
    const res = await fetch(
      `${MIRROR_BASE}/topics/${topicId}/messages?order=asc&limit=100`,
    );
    if (!res.ok) return;
    const json = await res.json();

    const answerers = new Map<string, number>(); // accountId -> sequence number of their answer
    const flaggedSequences = new Set<number>();

    for (const m of json.messages || []) {
      try {
        const p = JSON.parse(Buffer.from(m.message, "base64").toString("utf8"));
        if (p.type === "ANSWER") {
          const accountId = p.author?.accountId ?? p.answererAccountId;
          if (accountId && !answerers.has(accountId)) {
            answerers.set(accountId, m.sequence_number);
          }
        }
        if (p.isSpamFlag && p.replyToSequence) {
          flaggedSequences.add(p.replyToSequence);
        }
      } catch {
        /* skip malformed */
      }
    }

    for (const [accountId, seq] of answerers.entries()) {
      if (accountId === winnerAccountId) continue;

      if (flaggedSequences.has(seq)) {
        console.log(
          `Skipping refund for flagged answerer ${accountId} on Q#${questionSeq}`,
        );
        continue;
      }

      const evmAddress = await getEvmAddress(accountId);
      if (!evmAddress) continue;

      try {
        console.log(
          `Auto-refunding non-winner ${accountId} for Q#${questionSeq}`,
        );
        const callData = encodeRefundCalldata(topicId, questionSeq, evmAddress);

        await new ContractExecuteTransaction()
          .setContractId(ContractId.fromString(BOUNTY_CONTRACT_ID!))
          .setGas(200_000)
          .setFunctionParameters(callData)
          .execute(hederaClient);
      } catch (err) {
        console.error(
          `Failed to refund ${accountId} for Q#${questionSeq}:`,
          (err as Error).message,
        );
      }
    }
  } catch (err) {
    console.error(
      `Auto-refund loop failed for Q#${questionSeq}:`,
      (err as Error).message,
    );
  }
}

// ─── AI Thread Summarizer ────────────────────────────────────────────────────

/**
 * Fetches all answers from a resolved bounty discussion topic, generates a
 * concise AI summary via Groq, and posts it as an AI_COMMENT.
 * This turns every closed bounty thread into a structured, economically-verified
 * knowledge record — the foundation of the Vurso Dataset Marketplace.
 */
async function postThreadSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groq: any,
  hederaClient: ReturnType<typeof Client.forTestnet>,
  discussionTopicId: string,
  questionSeq: number,
) {
  if (!groq || !OPERATOR_ID) return;

  try {
    // Fetch all messages on the discussion topic
    const res = await fetch(
      `${MIRROR_BASE}/topics/${discussionTopicId}/messages?order=asc&limit=100`,
    );
    if (!res.ok) return;
    const json = await res.json();

    // Collect question + all human answers (skip AI answers and comments)
    const answerTexts: string[] = [];
    let acceptedAnswerText = "";

    for (const m of json.messages || []) {
      try {
        const p = JSON.parse(Buffer.from(m.message, "base64").toString("utf8"));
        if (p.type === "ANSWER" || p.type === "AI_ANSWER") {
          const body = p.body || "";
          if (body.length === 0) continue;
          if (p.accepted || p.type === "ACCEPTED") {
            acceptedAnswerText = body;
          } else {
            answerTexts.push(body);
          }
        }
        if (p.type === "ACCEPT") {
          // Mark the accepted answerer so we can identify the winning answer
        }
      } catch {
        /* skip malformed */
      }
    }

    if (answerTexts.length === 0 && !acceptedAnswerText) {
      console.log(
        `ℹ️  No answers to summarize for Q#${questionSeq} — skipping`,
      );
      return;
    }

    const allAnswers = [
      acceptedAnswerText ? `[ACCEPTED ANSWER]\n${acceptedAnswerText}` : "",
      ...answerTexts.map((a, i) => `[ANSWER ${i + 1}]\n${a}`),
    ]
      .filter(Boolean)
      .join("\n\n---\n\n");

    console.log(`📝  Generating thread summary for Q#${questionSeq}...`);

    const response = await groq.invoke([
      new SystemMessage(
        `You are Vurso AI. A developer Q&A bounty thread has been resolved. Your job is to produce a concise, structured markdown summary of the thread for the Vurso Dataset Marketplace.

Rules:
- Start with ## Thread Summary
- Write 2–4 bullet points capturing the key technical insights from the accepted answer.
- If other answers raised valid alternative approaches, add a ## Alternative Approaches section with 1–2 bullets.
- End with a ## Verified Insight line: one sentence that captures the core lesson as a training data point.
- Be factual and terse. No filler. Max 250 words.`,
      ),
      new HumanMessage(
        `Summarize this resolved developer Q&A thread:\n\n${allAnswers}`,
      ),
    ]);

    const summaryText =
      response.content?.toString().trim() ||
      "*(AI summary unavailable for this thread.)*";

    // Post the summary as an AI_COMMENT on the discussion topic
    const summaryPayload = JSON.stringify({
      type: "AI_COMMENT",
      body: summaryText,
      author: { accountId: OPERATOR_ID, displayName: "Vurso AI" },
      isAgentComment: true,
      isSummary: true,
      questionSequenceNumber: questionSeq,
      timestamp: Date.now(),
    });

    // Encode and submit directly via HCS SDK (no agent toolkit needed here)
    const msgBytes = Buffer.from(summaryPayload, "utf8");
    // HCS has a 1024-byte limit — truncate gracefully if needed
    const safeBytes =
      msgBytes.length <= 1024 ? msgBytes : msgBytes.slice(0, 1020);

    await new TopicMessageSubmitTransaction()
      .setTopicId(discussionTopicId)
      .setMessage(safeBytes)
      .execute(hederaClient);

    console.log(`Thread summary posted for Q#${questionSeq}`);
  } catch (err) {
    console.error(
      `Thread summary failed for Q#${questionSeq}:`,
      (err as Error).message,
    );
  }
}

import { Client, PrivateKey } from "@hashgraph/sdk";
import {
  HederaLangchainToolkit,
  AgentMode,
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
} from "hedera-agent-kit";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import fs from "fs";
import path from "path";
import { fetchFromIPFS, uploadToIPFS } from "@/lib/ipfs";

const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
const OPERATOR_ID = process.env.OPERATOR_ACCOUNT_ID;
const OPERATOR_KEY_RAW = process.env.OPERATOR_PRIVATE_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const QUESTIONS_TOPIC = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const POLL_INTERVAL_MS = 15_000;
const MIRROR_BASE =
  NETWORK === "mainnet"
    ? "https://mainnet-public.mirrornode.hedera.com/api/v1"
    : "https://testnet.mirrornode.hedera.com/api/v1";

const CURSOR_FILE = path.join(process.cwd(), ".vurso-agent-cursor.json");

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REVALIDATION_SECRET = process.env.NEXT_PUBLIC_REVALIDATION_SECRET || "";

let lastProcessedSequence = 0;

/**
 * Cache of questions recently seen, used for duplicate detection.
 * key: sequence number, value: { title, body }
 */
const questionCache = new Map<number, { title: string; body: string }>();

/**
 * Bounty discussion topics being actively monitored for spam answers.
 * key: discussionTopicId, value: { questionSeq, topicId (discussion) }
 */
const bountyTopicCache = new Map<
  string,
  { questionSeq: number; discussionTopicId: string }
>();

/**
 * Tracks the last answer message sequence number checked for spam on each
 * bounty discussion topic. Prevents re-scanning already-checked answers.
 * key: discussionTopicId, value: last sequence number seen
 */
const spamAnswerCursors = new Map<string, number>();

function loadAgentCursor() {
  try {
    if (fs.existsSync(CURSOR_FILE)) {
      const data = JSON.parse(fs.readFileSync(CURSOR_FILE, "utf8"));
      lastProcessedSequence = data.lastProcessedSequence || 0;

      // Load bounty topics to track
      if (data.bountyTopics && Array.isArray(data.bountyTopics)) {
        for (const topic of data.bountyTopics) {
          bountyTopicCache.set(topic.discussionTopicId, topic);
        }
      }

      // Load spamAnswerCursors map
      if (
        data.spamAnswerCursors &&
        typeof data.spamAnswerCursors === "object"
      ) {
        for (const [topicId, seq] of Object.entries(data.spamAnswerCursors)) {
          spamAnswerCursors.set(topicId, seq as number);
        }
      }

      console.log(
        `AI Agent loaded cursor at sequence: ${lastProcessedSequence}`,
      );
    }
  } catch {
    // Ignore read errors
  }
}

function saveAgentCursor() {
  try {
    const data = {
      lastProcessedSequence,
      spamAnswerCursors: Object.fromEntries(spamAnswerCursors.entries()),
      bountyTopics: Array.from(bountyTopicCache.values()),
    };
    fs.writeFileSync(CURSOR_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Ignore write errors
  }
}

/**
 * AI Agent Background Service
 * Launched via instrumentation.ts.
 *
 * For every new QUESTION on HCS:
 *  1. Check for semantic duplicates against the cached question list.
 *     If duplicate found → post a duplicate-warning AI_COMMENT.
 *  2. If NOT a duplicate → generate a real developer answer via Groq
 *     and post it as type:"AI_ANSWER" to the question's discussionTopicId.
 *
 * The AI is the platform operator account and is never eligible for bounties.
 */
export async function startAIAgent() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!OPERATOR_ID || !OPERATOR_KEY_RAW || !QUESTIONS_TOPIC) {
    console.warn("AI Agent missing env vars — skipping startup");
    return;
  }

  console.log("Starting AI Agent Background Service...");

  const OPERATOR_KEY = OPERATOR_KEY_RAW.startsWith("0x")
    ? OPERATOR_KEY_RAW.slice(2)
    : OPERATOR_KEY_RAW;

  const hederaClient = (
    NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet()
  ).setOperator(OPERATOR_ID, PrivateKey.fromStringECDSA(OPERATOR_KEY));

  const hederaToolkit = new HederaLangchainToolkit({
    client: hederaClient,
    configuration: {
      tools: [],
      context: { mode: AgentMode.AUTONOMOUS },
      plugins: [coreConsensusPlugin, coreConsensusQueryPlugin],
    },
  });

  const groq = GROQ_API_KEY
    ? new ChatGroq({ apiKey: GROQ_API_KEY, model: GROQ_MODEL })
    : null;
  const submitTopicMsgTool = hederaToolkit
    .getTools()
    .find((t) => t.name === "submit_topic_message_tool");

  loadAgentCursor();

  // Warm up cache from Mirror Node first
  await bootstrapCache();

  async function pollTopicMessages() {
    const url = `${MIRROR_BASE}/topics/${QUESTIONS_TOPIC}/messages?order=asc&limit=25&sequenceNumber=gt:${lastProcessedSequence}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      for (const m of json.messages || []) {
        const seq: number = m.sequence_number;
        if (seq <= lastProcessedSequence) continue;
        lastProcessedSequence = Math.max(lastProcessedSequence, seq);
        saveAgentCursor();
        try {
          const payload = JSON.parse(
            Buffer.from(m.message, "base64").toString("utf8"),
          );
          if (payload.type === "QUESTION") {
            await processQuestion(seq, payload, groq, submitTopicMsgTool);
          }
        } catch {}
      }
    } catch (err) {
      console.warn("Agent poll error:", (err as Error).message);
    }
  }

  console.log(
    `📡  AI Agent polling HCS Topic: ${QUESTIONS_TOPIC} every ${POLL_INTERVAL_MS / 1000}s`,
  );
  await pollTopicMessages(); // immediate first poll
  setInterval(pollTopicMessages, POLL_INTERVAL_MS);

  // Also start the spam scanner for bounty discussion topics
  await scanAnswersForSpam(groq, submitTopicMsgTool);
  setInterval(
    () => scanAnswersForSpam(groq, submitTopicMsgTool),
    POLL_INTERVAL_MS,
  );
}

async function bootstrapCache() {
  const url = `https://${NETWORK === "mainnet" ? "mainnet-public" : "testnet"}.mirrornode.hedera.com/api/v1/topics/${QUESTIONS_TOPIC}/messages?order=desc&limit=100`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    for (const m of json.messages || []) {
      const seq = m.sequence_number;
      if (seq > lastProcessedSequence) {
        lastProcessedSequence = seq;
      }
      try {
        const payload = JSON.parse(
          Buffer.from(m.message, "base64").toString("utf8"),
        );
        if (payload.type === "QUESTION") {
          questionCache.set(seq, {
            title: payload.title,
            body: payload.shortDescription,
          });

          // Also populate bounty topics for spam tracking on restart
          if (
            payload.bountyAmount > 0 &&
            payload.discussionTopicId &&
            !bountyTopicCache.has(payload.discussionTopicId)
          ) {
            bountyTopicCache.set(payload.discussionTopicId, {
              questionSeq: seq,
              discussionTopicId: payload.discussionTopicId,
            });
            console.log(
              `📌  Restored bounty topic ${payload.discussionTopicId} (Q#${seq}) for spam monitoring`,
            );
          }
        }
      } catch {}
    }
    console.log(`AI Agent warmed up: ${questionCache.size} questions cached.`);
    saveAgentCursor();
  } catch (err) {
    console.warn("Failed to bootstrap AI agent cache:", (err as Error).message);
  }
}

// ─── Answer Generation ────────────────────────────────────────────────────────

/**
 * Generate a real developer answer using Groq Llama 3.3 70B.
 * Returns a markdown-formatted answer string, or null on failure.
 */
async function generateAIAnswer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groq: any,
  title: string,
  body: string,
  tags: string[],
): Promise<string | null> {
  try {
    const tagContext = tags.length > 0 ? `Tags: ${tags.join(", ")}` : "";
    const response = await groq.invoke([
      new SystemMessage(
        `You are Vurso AI, an expert developer assistant. Answer the developer's technical question with a clear, accurate, and practical markdown-formatted response.

Rules:
- Be concise but complete. Include code examples using fenced code blocks when helpful.
- If you reference a library or framework, name the specific version if relevant.
- End with a brief note if there are important caveats or alternative approaches.
- Do NOT use phrases like "Great question!" or filler. Get straight to the answer.
- Format: start directly with the answer, use headers sparingly only for long multi-part answers.`,
      ),
      new HumanMessage(
        `Question: ${title}\n\n${body}${tagContext ? `\n\n${tagContext}` : ""}`,
      ),
    ]);
    const text = response.content?.toString().trim();
    return text || null;
  } catch (err) {
    console.error("AI answer generation error:", (err as Error).message);
    return null;
  }
}

// ─── Question Processing ──────────────────────────────────────────────────────

async function processQuestion(
  seq: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groq: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postTool: any,
) {
  const title = payload.title || "Untitled";
  const tags: string[] = payload.tags || [];
  const hasBounty: boolean =
    typeof payload.bountyAmount === "number" && payload.bountyAmount > 0;
  const discussionTopicId: string | undefined = payload.discussionTopicId;

  console.log(`🔍  Analyzing Q#${seq}: "${title.slice(0, 50)}..."`);

  if (!groq || !postTool) {
    // No LLM configured — just cache and exit
    questionCache.set(seq, { title, body: payload.shortDescription });
    return;
  }

  // ── Step 1: Resolve full question body (IPFS if bodyCid set) ────────────────
  let questionBody: string = payload.shortDescription || payload.body || "";
  if (payload.bodyCid) {
    try {
      const ipfsBody = await fetchFromIPFS(payload.bodyCid);
      if (ipfsBody) questionBody = ipfsBody;
    } catch {
      // Fall back to inline body
    }
  }

  // ── Step 2: Check for duplicate against question cache ──────────────────────
  const cache = [...questionCache.entries()]
    .filter(([s]) => s !== seq)
    .slice(-30)
    .map(([s, q]) => `[${s}] ${q.title}`)
    .join("\n");

  let isDuplicate = false;
  let matchSeq: number | null = null;
  let duplicateExplanation = "";

  if (cache.length > 0) {
    try {
      const dupResponse = await groq.invoke(
        [
          new SystemMessage(
            'Detect semantic duplicates. Respond ONLY with JSON: { "isDuplicate": boolean, "matchSeq": number|null, "explanation": string }',
          ),
          new HumanMessage(`NEW: ${title}\nEXISTING:\n${cache}`),
        ],
        { response_format: { type: "json_object" } },
      );
      const result = JSON.parse(dupResponse.content.toString());
      isDuplicate = result.isDuplicate === true;
      matchSeq = result.matchSeq ?? null;
      duplicateExplanation = result.explanation ?? "";
    } catch (err) {
      console.error("Duplicate detection error:", (err as Error).message);
    }
  }

  // ── Step 3: Post duplicate warning OR generate a real answer ─────────────────
  if (isDuplicate && matchSeq && discussionTopicId) {
    // Duplicate found — warn regardless of bounty status
    console.log(`🚩  Duplicate detected! Q#${seq} matches Q#${matchSeq}`);
    try {
      await postTool.invoke({
        topicId: discussionTopicId,
        message: JSON.stringify({
          type: "AI_COMMENT",
          body: `> **Similar question detected** — this may already be answered at [question #${matchSeq}](/questions/${matchSeq})\n\n${duplicateExplanation}`,
          author: { accountId: OPERATOR_ID, displayName: "Vurso AI" },
          isAgentComment: true,
          timestamp: Date.now(),
        }),
      });
    } catch (err) {
      console.error(
        "Failed to post duplicate warning:",
        (err as Error).message,
      );
    }
  } else if (!hasBounty && discussionTopicId) {
    // No bounty, not a duplicate — generate and post a real AI answer
    console.log(
      `Generating AI answer for Q#${seq}: "${title.slice(0, 50)}..."`,
    );
    const aiAnswer = await generateAIAnswer(groq, title, questionBody, tags);

    if (aiAnswer) {
      let finalBody = aiAnswer;
      let bodyCid: string | undefined;

      // HCS messages have a strict 1024 byte limit.
      // If the AI answer exceeds this, upload to IPFS just like human answers do.
      if (finalBody.length > 500) {
        try {
          bodyCid = await uploadToIPFS(finalBody, `ai-answer-${seq}`);
          finalBody = ""; // Clear inline body since it's now on IPFS
        } catch (err) {
          console.warn("AI IPFS upload failed, attempting to send inline", err);
        }
      }

      try {
        await postTool.invoke({
          topicId: discussionTopicId,
          message: JSON.stringify({
            type: "AI_ANSWER",
            questionSequenceNumber: seq,
            body: finalBody,
            bodyCid,
            author: { accountId: OPERATOR_ID, displayName: "Vurso AI" },
            isAgentAnswer: true,
            hasBounty: false,
            timestamp: Date.now(),
          }),
        });
        console.log(`AI answer posted for Q#${seq}`);

        // Revalidate the question detail page so the AI answer appears immediately
        const revalidationSecret = process.env.NEXT_PUBLIC_REVALIDATION_SECRET;
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        if (revalidationSecret) {
          await fetch(`${appUrl}/api/revalidate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret: revalidationSecret,
              paths: [`/questions/${seq}`, "/questions"],
            }),
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to post AI answer:", (err as Error).message);
      }
    }
  } else if (hasBounty && discussionTopicId) {
    // Bounty question, not a duplicate — AI stands aside for human experts.
    // Duplicate/spam monitoring is already done above; no answer is generated.
    console.log(`Bounty Q#${seq} — AI standing aside. Human experts only.`);
  }

  // Cache question for future duplicate detection
  questionCache.set(seq, { title, body: payload.shortDescription });

  // Register bounty discussion topics for answer spam monitoring
  if (
    hasBounty &&
    discussionTopicId &&
    !bountyTopicCache.has(discussionTopicId)
  ) {
    bountyTopicCache.set(discussionTopicId, {
      questionSeq: seq,
      discussionTopicId,
    });
    console.log(
      `📌  Registered bounty topic ${discussionTopicId} (Q#${seq}) for spam monitoring`,
    );
  }
}

// ─── Answer Spam Detection ───────────────────────────────────────────────────

/**
 * Polls all tracked bounty discussion topics for new ANSWER messages.
 * Runs every POLL_INTERVAL_MS alongside the question poller.
 */
async function scanAnswersForSpam(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groq: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postTool: any,
) {
  if (!groq || !postTool) return;

  for (const [discussionTopicId, entry] of bountyTopicCache.entries()) {
    const lastSeen = spamAnswerCursors.get(discussionTopicId) ?? 0;
    let url = `${MIRROR_BASE}/topics/${discussionTopicId}/messages?order=asc&limit=50`;
    if (lastSeen > 0) {
      url += `&sequencenumber=gt:${lastSeen}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(
          `Spam scan mirror API error for ${discussionTopicId}: HTTP ${res.status}`,
        );
        continue;
      }
      const json = await res.json();

      let hasNewMessages = false;
      for (const m of json.messages || []) {
        const seq: number = m.sequence_number;
        if (seq <= lastSeen) continue;
        spamAnswerCursors.set(discussionTopicId, seq);
        hasNewMessages = true;

        try {
          const payload = JSON.parse(
            Buffer.from(m.message, "base64").toString("utf8"),
          );

          // Only inspect human ANSWER messages — skip AI answers, comments, ACCEPTs
          if (payload.type !== "ANSWER") continue;
          if (payload.isAgentAnswer) continue;

          const answererAccountId: string =
            payload.author?.accountId ?? payload.answererAccountId;
          if (!answererAccountId) continue;

          // Skip replies — they don't have deposits
          if (payload.replyTo !== undefined) continue;

          const answerBody: string = payload.body || "";

          console.log(
            `Spam-checking answer on topic ${discussionTopicId} seq#${seq} by ${answererAccountId}`,
          );

          await checkAnswerForSpam(
            groq,
            postTool,
            discussionTopicId,
            seq,
            entry.questionSeq,
            answererAccountId,
            answerBody,
          );
        } catch {
          /* skip malformed messages */
        }
      }

      if (hasNewMessages) {
        saveAgentCursor();
      }
    } catch (err) {
      console.warn(
        `Spam scan error for topic ${discussionTopicId}:`,
        (err as Error).message,
      );
    }
  }
}

/**
 * Runs a Groq spam check on a single answer.
 * Scores the answer 0–10 for spamminess. Slashes at >= 9.
 *
 * Spam signals:
 *  - Generic placeholder text ("just use X", "refer to docs", etc.)
 *  - Obvious AI hallucination (confident wrong technical claims, fake code)
 *  - Completely off-topic or unrelated to the question
 *  - Copy-paste of the question back as an answer
 *  - Intentionally unhelpful (single emoji, "lol", etc.)
 */
async function checkAnswerForSpam(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groq: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postTool: any,
  discussionTopicId: string,
  answerSeq: number,
  questionSeq: number,
  answererAccountId: string,
  answerBody: string,
) {
  if (!answerBody.trim() || answerBody.trim().length < 10) {
    // Too short to evaluate meaningfully
    return;
  }

  let spamScore = 0;
  let spamReason = "";

  const qContext = questionCache.get(questionSeq);
  const qTitle = qContext?.title || "Unknown Question";
  const qBody = qContext?.body || "";

  try {
    const response = await groq.invoke(
      [
        new SystemMessage(
          `You are a strict spam detection AI for a developer Q&A platform where users lock financial bounties for good answers.
Evaluate whether an answer is spam, low-effort garbage, an AI hallucination, or entirely off-topic to the specific question asked.

Spam signals that MUST result in a score of 9 or 10:
- Begging for cryptocurrency, tips, or money (e.g., "send HBAR", "donate to my wallet")
- Telling the user to "read the docs" or "google it" without providing any specific tailored solution
- Giving an answer that is completely unrelated to the specific Question asked
- Generic placeholder replies ("just use a while loop", "lol")
- Promotional, abusive, or phishing content

Respond ONLY with valid JSON: { "score": number (0-10), "reason": string }
Score 0 = definitely legitimate and attempts to answer the specific question. Score 10 = definite spam/garbage/off-topic.
Be ruthless. If it contains begging or is off-topic, score it 9 or 10.`,
        ),
        new HumanMessage(
          `Original Question:\nTitle: ${qTitle}\nBody: ${qBody}\n\nAnswer to evaluate:\n\n${answerBody.slice(0, 2000)}`,
        ),
      ],
      { response_format: { type: "json_object" } },
    );

    const result = JSON.parse(response.content.toString());
    spamScore = typeof result.score === "number" ? result.score : 0;
    spamReason = result.reason ?? "";
  } catch (err) {
    console.error("Spam check LLM error:", (err as Error).message);
    return; // Don't slash on LLM errors
  }

  if (spamScore < 9) {
    // Legitimate answer — no action
    if (spamScore >= 6) {
      console.log(
        `Borderline answer on topic ${discussionTopicId} seq#${answerSeq} (score: ${spamScore}/10) — flagging but NOT slashing`,
      );
    }
    return;
  }

  // Score >= 9 — extreme confidence this is spam. Auto-slash.
  console.log(
    `SPAM DETECTED (score: ${spamScore}/10) on topic ${discussionTopicId} seq#${answerSeq} by ${answererAccountId}. Reason: ${spamReason}`,
  );

  // Step 1: Resolve the answerer's EVM address (needed for contract call)
  let answererEvmAddress: string | null = null;
  try {
    const mirrorRes = await fetch(
      `${MIRROR_BASE}/accounts/${answererAccountId}`,
    );
    if (mirrorRes.ok) {
      const mirrorJson = await mirrorRes.json();
      answererEvmAddress = mirrorJson.evm_address ?? null;
    }
  } catch {
    /* ignore */
  }

  // Step 2: Post a public warning comment on the discussion topic
  try {
    await postTool.invoke({
      topicId: discussionTopicId,
      message: JSON.stringify({
        type: "REPLY",
        replyToSequence: answerSeq,
        body: `The deposit for this answer has been slashed (confidence: ${spamScore}/10).\n\n**Reason:** ${spamReason}\n\nIf you believe this is an error, contact the platform operator.`,
        author: { accountId: OPERATOR_ID, displayName: "Vurso AI" },
        isAgentComment: true,
        isSpamFlag: true,
        timestamp: Date.now(),
      }),
    });
  } catch (err) {
    console.error("Failed to post spam warning:", (err as Error).message);
  }

  // Step 3: Call the slash-deposit API (only if we have an EVM address)
  if (answererEvmAddress && REVALIDATION_SECRET) {
    const questionBody = questionCache.get(questionSeq);
    // The topicId used at lockBounty time is the discussionTopicId;
    // sequenceNumber was 0 (per the contract locking convention in releaseBounty)
    try {
      const slashRes = await fetch(`${APP_URL}/api/bounty/slash-deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operator-secret": REVALIDATION_SECRET,
        },
        body: JSON.stringify({
          topicId: discussionTopicId,
          sequenceNumber: 0,
          answererEvmAddress,
          reason: `Spam (score ${spamScore}/10): ${spamReason}`,
        }),
      });

      if (slashRes.ok) {
        const slashData = await slashRes.json();
        console.log(
          `Deposit slashed for ${answererAccountId} on Q#${questionSeq} | tx: ${slashData.transactionId}`,
        );
      } else {
        const errData = await slashRes.json().catch(() => ({}));
        console.error(`Slash API failed for ${answererAccountId}:`, errData);
      }
    } catch (err) {
      console.error("Slash API call error:", (err as Error).message);
    }

    // Suppress unused variable warning
    void questionBody;
  } else if (!answererEvmAddress) {
    console.warn(
      `Could not resolve EVM address for ${answererAccountId} — deposit NOT slashed (manual action required)`,
    );
  }
}

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
import { fetchFromIPFS } from "@/lib/ipfs";

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

let lastProcessedSequence = 0;
const questionCache = new Map();

function loadAgentCursor() {
  try {
    if (fs.existsSync(CURSOR_FILE)) {
      const data = JSON.parse(fs.readFileSync(CURSOR_FILE, "utf8"));
      lastProcessedSequence = data.lastProcessedSequence || 0;
      console.log(
        `🤖  AI Agent loaded cursor at sequence: ${lastProcessedSequence}`,
      );
    }
  } catch {
    // Ignore read errors
  }
}

function saveAgentCursor() {
  try {
    fs.writeFileSync(
      CURSOR_FILE,
      JSON.stringify({ lastProcessedSequence }),
      "utf8",
    );
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
    console.warn("⚠️  AI Agent missing env vars — skipping startup");
    return;
  }

  console.log("🤖  Starting AI Agent Background Service...");

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
      console.warn("⚠️  Agent poll error:", (err as Error).message);
    }
  }

  console.log(
    `📡  AI Agent polling HCS Topic: ${QUESTIONS_TOPIC} every ${POLL_INTERVAL_MS / 1000}s`,
  );
  await pollTopicMessages(); // immediate first poll
  setInterval(pollTopicMessages, POLL_INTERVAL_MS);
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
        }
      } catch {}
    }
    console.log(
      `✅  AI Agent warmed up: ${questionCache.size} questions cached.`,
    );
    saveAgentCursor();
  } catch (err) {
    console.warn(
      "⚠️  Failed to bootstrap AI agent cache:",
      (err as Error).message,
    );
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
    console.error("❌  AI answer generation error:", (err as Error).message);
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
      console.error("❌  Duplicate detection error:", (err as Error).message);
    }
  }

  // ── Step 3: Post duplicate warning OR generate a real answer ─────────────────
  if (isDuplicate && matchSeq && discussionTopicId) {
    // Duplicate found — warn, do not answer
    console.log(`🚩  Duplicate detected! Q#${seq} matches Q#${matchSeq}`);
    try {
      await postTool.invoke({
        topicId: discussionTopicId,
        message: JSON.stringify({
          type: "AI_COMMENT",
          body: `> 🤖 **Similar question detected** — this may already be answered at [question #${matchSeq}](/questions/${matchSeq})\n\n${duplicateExplanation}`,
          author: { accountId: OPERATOR_ID, displayName: "🤖 Vurso AI" },
          isAgentComment: true,
          timestamp: Date.now(),
        }),
      });
    } catch (err) {
      console.error(
        "❌  Failed to post duplicate warning:",
        (err as Error).message,
      );
    }
  } else if (discussionTopicId) {
    // Not a duplicate — generate and post a real answer
    console.log(
      `✍️  Generating AI answer for Q#${seq}: "${title.slice(0, 50)}..."`,
    );
    const aiAnswer = await generateAIAnswer(groq, title, questionBody, tags);

    if (aiAnswer) {
      // Append human-competition note if there's a bounty
      const bountyNote = hasBounty
        ? `\n\n---\n*💰 This question has a bounty. The bounty is reserved for human experts — post a better answer to compete for it.*`
        : "";

      try {
        await postTool.invoke({
          topicId: discussionTopicId,
          message: JSON.stringify({
            type: "AI_ANSWER",
            questionSequenceNumber: seq,
            body: aiAnswer + bountyNote,
            author: { accountId: OPERATOR_ID, displayName: "🤖 Vurso AI" },
            isAgentAnswer: true,
            hasBounty,
            timestamp: Date.now(),
          }),
        });
        console.log(`✅  AI answer posted for Q#${seq}`);
      } catch (err) {
        console.error("❌  Failed to post AI answer:", (err as Error).message);
      }
    }
  }

  // Cache question for future duplicate detection
  questionCache.set(seq, { title, body: payload.shortDescription });
}

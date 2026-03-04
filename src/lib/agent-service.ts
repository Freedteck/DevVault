import { Client, PrivateKey, TopicMessageQuery, TopicId } from "@hashgraph/sdk";
import {
  HederaLangchainToolkit,
  AgentMode,
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
} from "hedera-agent-kit";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
const OPERATOR_ID = process.env.OPERATOR_ACCOUNT_ID;
const OPERATOR_KEY_RAW = process.env.OPERATOR_PRIVATE_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const QUESTIONS_TOPIC = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const RECONNECT_INTERVAL_MS = 10_000;

let lastProcessedSequence = 0;
const questionCache = new Map();

/**
 * AI Agent Background Service
 * Launched via instrumentation.ts to provide autonomous real-time duplicates detection.
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

  // Warm up cache from Mirror Node first
  await bootstrapCache();

  function subscribe() {
    console.log(`📡  Subscribing to HCS Topic: ${QUESTIONS_TOPIC}`);
    new TopicMessageQuery()
      .setTopicId(TopicId.fromString(QUESTIONS_TOPIC!))
      .setStartTime(0)
      .subscribe(
        hederaClient,
        (err) => {
          console.warn("⚠️  Agent subscription error, reconnecting...", err);
          setTimeout(subscribe, RECONNECT_INTERVAL_MS);
        },
        async (msg) => {
          const seq = msg.sequenceNumber.toNumber();
          if (seq <= lastProcessedSequence) return;
          lastProcessedSequence = Math.max(lastProcessedSequence, seq);

          const content = Buffer.from(msg.contents).toString("utf8");
          try {
            const payload = JSON.parse(content);
            if (payload.type === "QUESTION") {
              await processQuestion(seq, payload, groq, submitTopicMsgTool);
            }
          } catch {}
        },
      );
  }

  subscribe();
}

async function bootstrapCache() {
  const url = `https://${NETWORK === "mainnet" ? "mainnet-public" : "testnet"}.mirrornode.hedera.com/api/v1/topics/${QUESTIONS_TOPIC}/messages?order=desc&limit=100`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    for (const m of json.messages || []) {
      const seq = m.sequence_number;
      lastProcessedSequence = Math.max(lastProcessedSequence, seq);
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
  } catch (err: any) {
    console.warn("⚠️  Failed to bootstrap AI agent cache:", err.message);
  }
}

async function processQuestion(
  seq: number,
  payload: any,
  groq: any,
  postTool: any,
) {
  const title = payload.title || "Untitled";
  console.log(`🔍  Analyzing Q#${seq}: "${title.slice(0, 50)}..."`);

  if (!groq || !postTool) return;

  const cache = [...questionCache.entries()]
    .filter(([s]) => s !== seq)
    .slice(-30)
    .map(([s, q]) => `[${s}] ${q.title}`)
    .join("\n");

  if (cache.length === 0) {
    questionCache.set(seq, { title, body: payload.shortDescription });
    return;
  }

  try {
    const response = await groq.invoke(
      [
        new SystemMessage(
          'Detect semantic duplicates. Respond ONLY with JSON: { "isDuplicate": boolean, "matchSeq": number|null, "explanation": string }',
        ),
        new HumanMessage(`NEW: ${title}\nEXISTING:\n${cache}`),
      ],
      { response_format: { type: "json_object" } },
    );

    const result = JSON.parse(response.content.toString());
    if (result.isDuplicate && result.matchSeq && payload.discussionTopicId) {
      console.log(
        `🚩  Duplicate detected! Q#${seq} matches Q#${result.matchSeq}`,
      );
      await postTool.invoke({
        topicId: payload.discussionTopicId,
        message: JSON.stringify({
          type: "AI_COMMENT",
          body: `> 🤖 **Duplicate detected** — similar to [question #${result.matchSeq}](/questions/${result.matchSeq})\n\n${result.explanation}`,
          author: { accountId: OPERATOR_ID, displayName: "🤖 DevVault AI" },
          isAgentComment: true,
          timestamp: Date.now(),
        }),
      });
    }
  } catch (err: any) {
    console.error("❌  AI detection error:", err.message);
  }

  questionCache.set(seq, { title, body: payload.shortDescription });
}

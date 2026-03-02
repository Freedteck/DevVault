/**
 * DevVault HCS-10 AI Duplicate-Detection Agent  v3.0.0
 *
 * Stack:
 *   hedera-agent-kit      — HederaLangchainToolkit wraps Hedera HCS ops as
 *                           LangChain tools (the official Hedera agent pattern)
 *   @langchain/groq       — ChatGroq for Groq llama-3.3-70b-versatile LLM
 *   @hashgraph/sdk        — Hedera client needed by hedera-agent-kit
 *   @hashgraphonline/     — HCS10Client for HCS-10 agent registration and
 *     standards-sdk         HCS-11 profile storage (HOL $8K bounty ops)
 *
 * How it works:
 *   1. Bootstrap: create/reuse HCS-10 inbound + outbound topics, register in
 *      HOL registry via HCS10Client.registerAgent(), store HCS-11 profile.
 *   2. Poll every 30 s: call get_topic_messages_query_tool (hedera-agent-kit)
 *      on the DevVault Questions topic.
 *   3. For each new QUESTION message, ask ChatGroq (Groq) whether it is a
 *      semantic duplicate of any previously seen question.
 *   4. If duplicate detected: call submit_topic_message_tool (hedera-agent-kit)
 *      to post an AI_COMMENT on the question's discussion topic, and write an
 *      AGENT_ACTION audit entry to the outbound topic via HCS10Client.
 *
 * Required env vars (.env.local):
 *   OPERATOR_ACCOUNT_ID          — Hedera operator account  (e.g. 0.0.4691108)
 *   OPERATOR_PRIVATE_KEY         — ECDSA private key (0x… or raw hex)
 *   NEXT_PUBLIC_HEDERA_NETWORK   — testnet | mainnet
 *   NEXT_PUBLIC_QUESTIONS_TOPIC_ID
 *   NEXT_PUBLIC_REGISTRY_TOPIC_ID
 *   GROQ_API_KEY                 — https://console.groq.com/keys (free tier)
 *
 * Auto-written on first run:
 *   AGENT_INBOUND_TOPIC_ID
 *   AGENT_OUTBOUND_TOPIC_ID
 *
 * Run: pnpm run agent
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Env loading (before any SDK import) ─────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath   = path.join(__dirname, '../.env.local');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(envPath);

// ─── SDK imports ─────────────────────────────────────────────────────────────

// hedera-agent-kit — official Hedera agent toolkit (LangChain tools for Hedera)
import {
  HederaLangchainToolkit,
  AgentMode,
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
} from 'hedera-agent-kit';

// @langchain/groq — the Groq LLM integration for LangChain
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// @hashgraph/sdk — Hedera client required by HederaLangchainToolkit
import { Client, PrivateKey } from '@hashgraph/sdk';

// @hashgraphonline/standards-sdk — HCS-10 / HCS-11 agent registration (HOL bounty)
import {
  HCS10Client,
  AIAgentCapability,
  InboundTopicType,
} from '@hashgraphonline/standards-sdk';

// ─── Config ──────────────────────────────────────────────────────────────────

const NETWORK          = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
const OPERATOR_ID      = process.env.OPERATOR_ACCOUNT_ID;
const OPERATOR_KEY_RAW = process.env.OPERATOR_PRIVATE_KEY || '';
const GROQ_API_KEY     = process.env.GROQ_API_KEY;
const QUESTIONS_TOPIC  = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID;
const REGISTRY_TOPIC   = process.env.NEXT_PUBLIC_REGISTRY_TOPIC_ID;

if (!OPERATOR_ID || !OPERATOR_KEY_RAW) {
  console.error('❌  OPERATOR_ACCOUNT_ID and OPERATOR_PRIVATE_KEY are required');
  process.exit(1);
}
if (!QUESTIONS_TOPIC) {
  console.error('❌  NEXT_PUBLIC_QUESTIONS_TOPIC_ID is required');
  process.exit(1);
}

// hedera-agent-kit needs raw hex (no 0x prefix)
const OPERATOR_KEY = OPERATOR_KEY_RAW.startsWith('0x')
  ? OPERATOR_KEY_RAW.slice(2)
  : OPERATOR_KEY_RAW;

const AGENT_NAME        = 'DevVault Duplicate Detector';
const AGENT_DESCRIPTION =
  'AI-powered duplicate question detection. ' +
  'Uses Hedera Agent Kit (HCS LangChain tools) + Groq llama-3.3-70b-versatile + HCS-10 OpenConvAI.';
const GROQ_MODEL        = 'llama-3.3-70b-versatile';
const POLL_INTERVAL_MS  = 30_000;

// ─── Hedera SDK client (required by HederaLangchainToolkit) ──────────────────

const hederaClient = (NETWORK === 'mainnet' ? Client.forMainnet() : Client.forTestnet())
  .setOperator(OPERATOR_ID, PrivateKey.fromStringECDSA(OPERATOR_KEY));

// ─── HederaLangchainToolkit ───────────────────────────────────────────────────
// Provides Hedera HCS operations as proper LangChain tools:
//   get_topic_messages_query_tool  — reads messages from an HCS topic
//   submit_topic_message_tool      — posts a message to an HCS topic
//   create_topic_tool              — creates an HCS topic

const hederaToolkit = new HederaLangchainToolkit({
  client: hederaClient,
  configuration: {
    tools:   [],  // empty = load all default tools from specified plugins
    context: { mode: AgentMode.AUTONOMOUS },
    plugins: [coreConsensusPlugin, coreConsensusQueryPlugin],
  },
});

const hederaTools = hederaToolkit.getTools();

// Convenience references to the specific tools we use directly
const getTopicMsgsTool = hederaTools.find(
  (t) => t.name === 'get_topic_messages_query_tool'
);
const submitTopicMsgTool = hederaTools.find(
  (t) => t.name === 'submit_topic_message_tool'
);

if (!getTopicMsgsTool || !submitTopicMsgTool) {
  console.error('❌  Required HCS LangChain tools not found in HederaLangchainToolkit');
  console.error('   Available:', hederaTools.map((t) => t.name).join(', '));
  process.exit(1);
}

// ─── ChatGroq (Groq LLM via @langchain/groq) ─────────────────────────────────

let groq = null;
if (GROQ_API_KEY) {
  groq = new ChatGroq({
    apiKey: GROQ_API_KEY,
    model:  GROQ_MODEL,
  });
  console.log(`🤖  ChatGroq ready — ${GROQ_MODEL}`);
} else {
  console.warn('⚠️   GROQ_API_KEY not set — cache-only mode (no AI detection)');
}

// ─── HCS10Client (HCS-10 / HCS-11 for HOL registration) ─────────────────────
// Standards-SDK handles HCS-10 OpenConvAI protocol specifics:
//   createInboundTopic / createTopic — agent discovery topics
//   registerAgent                    — HOL registry registration
//   storeHCS11Profile                — HCS-11 agent identity profile

const hcsClient = new HCS10Client({
  network:            NETWORK,
  operatorId:         OPERATOR_ID,
  operatorPrivateKey: OPERATOR_KEY,
  logLevel:           'warn',
  prettyPrint:        true,
});

// ─── State ───────────────────────────────────────────────────────────────────

/** seqNum → { title, shortDescription, discussionTopicId } */
const questionCache      = new Map();
let lastProcessedSequence = 0;
let agentInboundTopicId  = process.env.AGENT_INBOUND_TOPIC_ID  || null;
let agentOutboundTopicId = process.env.AGENT_OUTBOUND_TOPIC_ID || null;

// ─── Utilities ───────────────────────────────────────────────────────────────

function appendEnv(key, value) {
  fs.appendFileSync(envPath, `\n${key}=${value}`, 'utf8');
  console.log(`  📝  Saved ${key}=${value} → .env.local`);
}

function parsePayload(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

// ─── HCS-10 agent setup (via HCS10Client) ─────────────────────────────────────

async function ensureAgentTopics() {
  if (!agentInboundTopicId) {
    console.log('📡  Creating HCS-10 inbound topic (HCS10Client)...');
    const id = await hcsClient.createInboundTopic(
      OPERATOR_ID,
      InboundTopicType.PUBLIC,
      60
    );
    agentInboundTopicId = id.toString();
    console.log('✅  Inbound topic:', agentInboundTopicId);
    appendEnv('AGENT_INBOUND_TOPIC_ID', agentInboundTopicId);
  }

  if (!agentOutboundTopicId) {
    console.log('📡  Creating HCS-10 outbound topic (HCS10Client)...');
    const id = await hcsClient.createTopic(
      `${AGENT_NAME} - Outbound`,
      true,
      true
    );
    agentOutboundTopicId = id.toString();
    console.log('✅  Outbound topic:', agentOutboundTopicId);
    appendEnv('AGENT_OUTBOUND_TOPIC_ID', agentOutboundTopicId);
  }
}

async function registerWithHOLRegistry() {
  if (!REGISTRY_TOPIC) {
    console.warn('⚠️   REGISTRY_TOPIC not set — skipping HOL registration');
    return;
  }
  console.log('📋  Registering in HOL Registry (HCS10Client.registerAgent())...');
  try {
    await hcsClient.registerAgent(
      REGISTRY_TOPIC,
      OPERATOR_ID,
      agentInboundTopicId,
      `${AGENT_NAME} — HCS-10 duplicate detection`
    );
    console.log('✅  Registered in HOL Registry');
  } catch (err) {
    console.warn('⚠️   Registry registration skipped:', err.message);
  }
}

async function storeHCS11Profile() {
  console.log('👤  Storing HCS-11 agent profile (HCS10Client.storeHCS11Profile())...');
  try {
    const result = await hcsClient.storeHCS11Profile(
      AGENT_NAME,
      AGENT_DESCRIPTION,
      agentInboundTopicId,
      agentOutboundTopicId,
      [
        AIAgentCapability.TEXT_GENERATION,
        AIAgentCapability.KNOWLEDGE_RETRIEVAL,
      ],
      {
        type:       'autonomous',
        model:      GROQ_MODEL,
        creator:    'DevVault',
        version:    '3.0.0',
        properties: {
          specialization: 'duplicate question detection',
          watchedTopics:  [QUESTIONS_TOPIC],
          standard:       'HCS-10',
          llmProvider:    'Groq (hedera-agent-kit + @langchain/groq)',
          hederaToolkit:  'hedera-agent-kit v3',
        },
      }
    );
    if (result?.success) {
      console.log('✅  HCS-11 profile stored:', result.profileTopicId);
    }
  } catch (err) {
    console.warn('⚠️   HCS-11 profile skipped:', err.message);
  }
}

// ─── Topic reading via HederaLangchainToolkit ─────────────────────────────────
// Uses get_topic_messages_query_tool from hedera-agent-kit — the proper
// LangChain/Hedera integrated way to query HCS topics.

async function fetchTopicMessages(topicId) {
  const raw = await getTopicMsgsTool.invoke({ topicId });
  // The tool returns a JSON string or object describing the messages
  const parsed = typeof raw === 'string' ? parsePayload(raw) : raw;
  // Normalise: some versions return { messages: [...] }, others return an array
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.messages) return parsed.messages;
  // Fallback: try to find any array in the result
  const firstArr = Object.values(parsed || {}).find(Array.isArray);
  return firstArr || [];
}

async function fetchNewQuestions(afterSeq = 0) {
  const messages = await fetchTopicMessages(QUESTIONS_TOPIC);
  return messages
    .filter((m) => {
      const seq = m.sequence_number ?? m.sequenceNumber ?? 0;
      if (seq <= afterSeq) return false;
      const payload = parsePayload(m.message ?? m.data ?? m.contents);
      return payload?.type === 'QUESTION';
    })
    .sort((a, b) => {
      const sa = a.sequence_number ?? a.sequenceNumber ?? 0;
      const sb = b.sequence_number ?? b.sequenceNumber ?? 0;
      return sa - sb;
    })
    .map((m) => ({
      sequenceNumber: m.sequence_number ?? m.sequenceNumber ?? 0,
      payload:        parsePayload(m.message ?? m.data ?? m.contents),
    }));
}

// ─── Duplicate detection via ChatGroq (@langchain/groq) ──────────────────────
// ChatGroq sends the existing question list + the new question to
// llama-3.3-70b-versatile and gets back a structured JSON verdict.

async function detectDuplicate(newQ, cachedQuestions) {
  if (!groq || cachedQuestions.size === 0) return null;

  const candidateLines = [...cachedQuestions.entries()]
    .slice(-50)  // last 50 questions for context-window budget
    .map(([seq, q]) => `[${seq}] ${q.title}`)
    .join('\n');

  const systemMsg = new SystemMessage(
    `You are a technical question deduplication engine for DevVault, a developer Q&A platform.\n` +
    `Detect whether a NEW question is a semantic duplicate (same core problem, different wording) of any EXISTING question.\n` +
    `Respond ONLY with a valid JSON object — no markdown, no prose outside the JSON.\n` +
    `Schema: { "isDuplicate": boolean, "matchSeq": number|null, "similarity": number (0-1), "explanation": string }`
  );

  const humanMsg = new HumanMessage(
    `NEW QUESTION (seq ${newQ.seq}):\n` +
    `Title: ${newQ.title}\n` +
    `Description: ${newQ.shortDescription || '(none)'}\n\n` +
    `EXISTING QUESTIONS (format: [seq] title):\n` +
    `${candidateLines}\n\n` +
    `Is the new question a semantic duplicate? Flag isDuplicate=true if similarity >= 0.82.`
  );

  try {
    // Bind json_object response format so ChatGroq always returns valid JSON
    const boundGroq = groq.bind({
      response_format: { type: 'json_object' },
    });

    const response = await boundGroq.invoke([systemMsg, humanMsg]);
    const content  = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    return JSON.parse(content.trim());
  } catch (err) {
    console.error('  ❌  ChatGroq error:', err.message);
    return null;
  }
}

// ─── Posting via submit_topic_message_tool (hedera-agent-kit) ─────────────────
// submit_topic_message_tool params: { topicId: string, message: string }

async function postDuplicateComment(
  discussionTopicId,
  newSeq,
  matchSeq,
  explanation,
  similarity
) {
  const pct = ((similarity || 0) * 100).toFixed(0);

  const commentPayload = {
    type: 'AI_COMMENT',
    body:
      `**🤖 DevVault AI — Possible Duplicate (${pct}% similarity)**\n\n` +
      `${explanation}\n\n` +
      `**Possible duplicate of question [#${matchSeq}](/questions?seq=${matchSeq})**.\n\n` +
      `If this is the same problem, consider closing as a duplicate, or add clarification.\n\n` +
      `*Posted automatically by ${AGENT_NAME} · Groq ${GROQ_MODEL} · ` +
      `hedera-agent-kit + HCS-10 OpenConvAI*`,
    author:            { accountId: OPERATOR_ID, displayName: AGENT_NAME },
    isAgentComment:    true,
    similarToSequence: matchSeq,
    similarityScore:   similarity,
    timestamp:         Date.now(),
  };

  // Post comment to discussionTopicId via hedera-agent-kit LangChain tool
  await submitTopicMsgTool.invoke({
    topicId: discussionTopicId,
    message: JSON.stringify(commentPayload),
  });
  console.log(`  ✅  AI_COMMENT posted via submit_topic_message_tool → ${discussionTopicId}`);

  // Write AGENT_ACTION audit trail to outbound topic via HCS10Client
  if (agentOutboundTopicId) {
    try {
      await hcsClient.submitPayload(agentOutboundTopicId, {
        type:            'AGENT_ACTION',
        standard:        'HCS-10',
        action:          'DUPLICATE_DETECTED',
        agentId:         OPERATOR_ID,
        questionSeqNum:  newSeq,
        similarToSeqNum: matchSeq,
        similarityScore: similarity,
        commentPostedTo: discussionTopicId,
        timestamp:       Date.now(),
      });
    } catch (err) {
      console.warn('  ⚠️  Outbound audit write failed (non-fatal):', err.message);
    }
  }
}

// ─── Processing ───────────────────────────────────────────────────────────────

async function processNewQuestion(seqNum, payload) {
  const title             = payload.title || `Question #${seqNum}`;
  const shortDescription  = payload.shortDescription || '';
  const discussionTopicId = payload.discussionTopicId;

  console.log(`\n🔍  Q#${seqNum}: "${title.slice(0, 70)}"`);

  // Cache immediately (before comparison, to catch batch duplicates)
  questionCache.set(seqNum, { title, shortDescription, discussionTopicId });

  if (!groq) { console.log('  ℹ️  Groq not configured — cached only'); return; }

  // Build snapshot without the current question
  const cacheWithoutSelf = new Map(
    [...questionCache.entries()].filter(([seq]) => seq !== seqNum)
  );
  if (cacheWithoutSelf.size === 0) {
    console.log('  ℹ️  No prior questions to compare');
    return;
  }

  const result = await detectDuplicate(
    { seq: seqNum, title, shortDescription },
    cacheWithoutSelf
  );

  if (!result) { console.log('  ⚠️  No result from ChatGroq'); return; }

  const simPct = ((result.similarity || 0) * 100).toFixed(0);
  console.log(
    `  🧠  isDuplicate=${result.isDuplicate}, similarity=${simPct}%,` +
    ` match=#${result.matchSeq ?? 'none'}`
  );
  console.log(`      "${result.explanation}"`);

  if (result.isDuplicate && result.matchSeq && discussionTopicId) {
    await postDuplicateComment(
      discussionTopicId,
      seqNum,
      result.matchSeq,
      result.explanation,
      result.similarity
    );
  }
}

// ─── Bootstrap cache ─────────────────────────────────────────────────────────

async function bootstrapQuestionCache() {
  console.log(
    '📦  Loading existing questions via get_topic_messages_query_tool (hedera-agent-kit)...'
  );
  try {
    const messages = await fetchTopicMessages(QUESTIONS_TOPIC);
    let count = 0;
    for (const m of messages) {
      const seq     = m.sequence_number ?? m.sequenceNumber ?? 0;
      const payload = parsePayload(m.message ?? m.data ?? m.contents);
      if (payload?.type !== 'QUESTION') continue;
      questionCache.set(seq, {
        title:             payload.title || '',
        shortDescription:  payload.shortDescription || '',
        discussionTopicId: payload.discussionTopicId,
      });
      lastProcessedSequence = Math.max(lastProcessedSequence, seq);
      count++;
    }
    console.log(`✅  Cached ${count} existing questions. Last seq: ${lastProcessedSequence}`);
  } catch (err) {
    console.error('⚠️   Bootstrap error (continuing):', err.message);
  }
}

// ─── Poll loop ────────────────────────────────────────────────────────────────

async function poll() {
  try {
    const newQs = await fetchNewQuestions(lastProcessedSequence);
    if (newQs.length > 0) {
      console.log(`\n📬  ${newQs.length} new question(s)`);
      for (const { sequenceNumber, payload } of newQs) {
        await processNewQuestion(sequenceNumber, payload);
        lastProcessedSequence = Math.max(lastProcessedSequence, sequenceNumber);
      }
    }
  } catch (err) {
    console.error('❌  Poll error:', err.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║    DevVault HCS-10 AI Agent  v3.0.0                          ║');
  console.log('║    hedera-agent-kit  +  @langchain/groq  +  standards-sdk    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`Network   : ${NETWORK}`);
  console.log(`Operator  : ${OPERATOR_ID}`);
  console.log(`Questions : ${QUESTIONS_TOPIC}`);
  console.log(`Registry  : ${REGISTRY_TOPIC || '(not set)'}`);
  console.log(`Groq      : ${groq ? `✅  ${GROQ_MODEL} (@langchain/groq)` : '❌  Not configured'}`);
  console.log(`HCS tools : ${hederaTools.map((t) => t.name).join(', ')}`);
  console.log();

  await ensureAgentTopics();       // HCS10Client — create/reuse HCS-10 topics
  await registerWithHOLRegistry(); // HCS10Client — register in HOL registry
  await storeHCS11Profile();       // HCS10Client — store HCS-11 identity profile
  await bootstrapQuestionCache();  // hedera-agent-kit — warm cache from existing questions

  console.log(
    `\n🔄  Polling every ${POLL_INTERVAL_MS / 1000}s via get_topic_messages_query_tool...\n`
  );
  await poll();
  setInterval(poll, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});

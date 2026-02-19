/**
 * DevVault AI Agent Runner
 *
 * Runs server-side (GitHub Actions) — operator key never touches the browser.
 *
 * Flow:
 *   1. Read recent questions from Hedera Mirror Node (public, no key needed)
 *   2. Skip any that already have an AI answer on the answers topic
 *   3. Fetch full content from Pinata gateway
 *   4. Call Groq to generate an answer
 *   5. If confidence ≥ 50%: upload answer to Pinata, post metadata to HCS
 *   6. Optionally log activity to HOL outbound topic (HCS-10)
 *
 * Env vars (GitHub Secrets):
 *   HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY
 *   GROQ_API_KEY
 *   PINATA_JWT, PINATA_GATEWAY
 *   QUESTION_TOPIC_ID, ANSWER_TOPIC_ID
 *   HOL_OUTBOUND_TOPIC_ID  (optional)
 *   HOL_INBOUND_TOPIC_ID   (optional)
 *   QUESTION_ID            (optional — process only this question)
 */

import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";

const MIRROR = "https://testnet.mirrornode.hedera.com";
const QUESTION_TOPIC = process.env.QUESTION_TOPIC_ID;
const ANSWER_TOPIC = process.env.ANSWER_TOPIC_ID;
const HOL_OUTBOUND = process.env.HOL_OUTBOUND_TOPIC_ID || "";
const HOL_INBOUND = process.env.HOL_INBOUND_TOPIC_ID || "";
const TARGET_QUESTION_ID = process.env.QUESTION_ID || "";
const MODEL = "llama-3.3-70b-versatile";

// ---------------------------------------------------------------------------
// Mirror Node helpers
// ---------------------------------------------------------------------------

function decodeMessages(rawMessages) {
  return rawMessages
    .map((msg) => {
      try {
        const content = Buffer.from(msg.message, "base64")
          .toString("utf8")
          .trim();
        return { sequenceNumber: msg.sequence_number, content };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function fetchRecentQuestions(limit = 20) {
  const res = await fetch(
    `${MIRROR}/api/v1/topics/${QUESTION_TOPIC}/messages?limit=${limit}&order=desc`,
  );
  const data = await res.json();
  return decodeMessages(data.messages || []);
}

/**
 * Check if any existing HCS answer for this questionId has isAI: true.
 * Paginate through all answers so we never miss one.
 */
async function hasAIAnswer(questionId) {
  let url = `${MIRROR}/api/v1/topics/${ANSWER_TOPIC}/messages?limit=100&order=desc`;

  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    const messages = decodeMessages(data.messages || []);

    for (const msg of messages) {
      try {
        const meta = JSON.parse(msg.content);
        if (meta.questionId === questionId && meta.isAI === true) return true;
      } catch {
        // skip malformed
      }
    }

    url = data.links?.next ? `${MIRROR}${data.links.next}` : null;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Pinata helpers
// ---------------------------------------------------------------------------

async function fetchFromPinata(cid) {
  const res = await fetch(`https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`);
  if (!res.ok) throw new Error(`Pinata fetch failed: ${res.statusText}`);
  return res.json();
}

async function uploadToPinata(payload) {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: { name: `devvault-ai-answer-${Date.now()}` },
    }),
  });

  const result = await res.json();
  if (!result.IpfsHash)
    throw new Error(`Pinata upload failed: ${JSON.stringify(result)}`);
  return result.IpfsHash;
}

// ---------------------------------------------------------------------------
// Groq helper
// ---------------------------------------------------------------------------

async function generateAnswer(title, description, codeSnippet, tags) {
  const systemPrompt = `You are DevVault AI Assistant, a helpful coding assistant that answers developer questions.

CRITICAL RULES:
1. Only answer if you are confident (≥50%) about the solution
2. Provide clear, actionable answers with code examples when relevant
3. Admit uncertainty if confidence <50%
4. Include confidence percentage at the end: "Confidence: XX%"

Your response format:
[Your answer here with code examples if needed]

Confidence: XX%
Reasoning: [Why you're confident or not]`;

  const userPrompt = [
    `Question: ${title}`,
    description ? `\nDetails: ${description}` : "",
    codeSnippet ? `\nCode:\n\`\`\`\n${codeSnippet}\n\`\`\`` : "",
    tags?.length ? `\nTags: ${tags.join(", ")}` : "",
    "\nPlease provide a comprehensive answer.",
  ]
    .filter(Boolean)
    .join("");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const data = await res.json();
  const response = data.choices?.[0]?.message?.content || "";

  const confidenceMatch = response.match(/Confidence:\s*(\d+)%/i);
  const reasoningMatch = response.match(/Reasoning:\s*(.+?)(?:\n\n|$)/is);

  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "No reasoning";
  const answer = response
    .replace(/Confidence:\s*\d+%/gi, "")
    .replace(/Reasoning:\s*.+$/is, "")
    .trim();

  return { answer, confidence, reasoning };
}

// ---------------------------------------------------------------------------
// Hedera helper
// ---------------------------------------------------------------------------

function getClient() {
  return Client.forTestnet().setOperator(
    process.env.HEDERA_ACCOUNT_ID,
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY),
  );
}

async function postToHCS(topicId, message) {
  const client = getClient();
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(typeof message === "string" ? message : JSON.stringify(message))
    .execute(client);

  await tx.getReceipt(client);
  return tx.transactionId.toString();
}

// ---------------------------------------------------------------------------
// Process one question
// ---------------------------------------------------------------------------

async function processQuestion(metadata, fullContent) {
  const { questionId, title, tags } = metadata;
  const { description, codeSnippet } = fullContent;

  console.log(`\n📝 Question: ${questionId}`);
  console.log(`   "${title}"`);

  if (await hasAIAnswer(questionId)) {
    console.log("   ⏭️  Already has an AI answer — skipping.");
    return;
  }

  const { answer, confidence, reasoning } = await generateAnswer(
    title,
    description,
    codeSnippet,
    tags,
  );

  console.log(`   Confidence: ${confidence}%`);
  console.log(`   Reasoning:  ${reasoning.slice(0, 100)}`);

  if (confidence < 50) {
    console.log("   ⚠️  Confidence too low — leaving for human experts.");
    return;
  }

  // Upload answer content to Pinata
  const cid = await uploadToPinata({ content: answer });

  // Build HCS metadata
  const agentAccountId = process.env.HEDERA_ACCOUNT_ID;
  const answerId = `a-${Date.now()}-${agentAccountId.split(".")[2]}`;
  const hcsMetadata = {
    type: "answer",
    answerId,
    questionId,
    author: agentAccountId,
    isAI: true,
    confidence,
    cid,
    timestamp: Date.now(),
  };

  // Post to answers topic
  const txId = await postToHCS(ANSWER_TOPIC, hcsMetadata);
  console.log(`   ✅ AI answer posted | tx: ${txId}`);

  // Log to HOL outbound topic (HCS-10) if configured
  if (HOL_OUTBOUND) {
    try {
      const operatorId = HOL_INBOUND
        ? `${HOL_INBOUND}@${agentAccountId}`
        : agentAccountId;

      await postToHCS(HOL_OUTBOUND, {
        p: "hcs-10",
        op: "message",
        operator_id: operatorId,
        data: JSON.stringify({
          event: "answer_published",
          questionId,
          answerId,
          confidence,
          platform: "DevVault",
        }),
        m: `DevVault AI: answered ${questionId} (${confidence}% confidence)`,
      });
      console.log("   📡 HOL activity logged.");
    } catch (err) {
      console.warn(`   ⚠️  HOL log failed: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🤖 DevVault AI Agent starting...\n");

  if (!QUESTION_TOPIC || !ANSWER_TOPIC) {
    console.error("❌ QUESTION_TOPIC_ID or ANSWER_TOPIC_ID not set");
    process.exit(1);
  }

  const recentMessages = await fetchRecentQuestions(20);
  console.log(`Fetched ${recentMessages.length} recent question messages.`);

  let processed = 0;

  for (const msg of recentMessages) {
    try {
      const metadata = JSON.parse(msg.content);

      if (metadata.type !== "question") continue;

      // If triggered for a specific question, skip all others
      if (TARGET_QUESTION_ID && metadata.questionId !== TARGET_QUESTION_ID)
        continue;

      const fullContent = await fetchFromPinata(metadata.cid);
      await processQuestion(metadata, fullContent);
      processed++;
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log(`\n✅ Done. Processed ${processed} question(s).`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

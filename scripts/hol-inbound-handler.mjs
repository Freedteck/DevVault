/**
 * DevVault HOL Inbound Message Handler
 *
 * Runs every 5 minutes via GitHub Actions.
 * Makes the DevVault AI Agent a two-way HCS-10 participant:
 *
 *   - connection_request : accept the connection, confirm on outbound topic
 *   - message            : parse the question, call Groq, deliver the answer
 *                          back to the sender's return topic
 *
 * The last-processed sequence number is persisted in .hol-cursor.json
 * via GitHub Actions cache so we never reprocess the same message.
 *
 * HCS-10 message format:
 *   { p: "hcs-10", op: "connection_request"|"message", operator_id: "<topicId>@<accountId>", data?, m? }
 *
 * Env vars (GitHub Secrets):
 *   HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY  — agent account (0.0.7982369)
 *   GROQ_API_KEY
 *   PINATA_GATEWAY
 *   QUESTION_TOPIC_ID, ANSWER_TOPIC_ID     — for context lookups
 *   HOL_INBOUND_TOPIC_ID                   — 0.0.7982371
 *   HOL_OUTBOUND_TOPIC_ID                  — 0.0.7982370
 */

import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";

const MIRROR = "https://testnet.mirrornode.hedera.com";
const CURSOR_FILE = ".hol-cursor.json";
const MODEL = "llama-3.3-70b-versatile";

const AGENT_ACCOUNT = process.env.HEDERA_ACCOUNT_ID;
const INBOUND_TOPIC = process.env.HOL_INBOUND_TOPIC_ID;
const OUTBOUND_TOPIC = process.env.HOL_OUTBOUND_TOPIC_ID;
const ANSWER_TOPIC = process.env.ANSWER_TOPIC_ID;

// ---------------------------------------------------------------------------
// Cursor — track which messages we have already handled
// ---------------------------------------------------------------------------

function loadCursor() {
  try {
    if (existsSync(CURSOR_FILE)) {
      return JSON.parse(readFileSync(CURSOR_FILE, "utf8"));
    }
  } catch {}
  return { lastSeq: 0 };
}

function saveCursor(cursor) {
  writeFileSync(CURSOR_FILE, JSON.stringify(cursor, null, 2));
}

// ---------------------------------------------------------------------------
// Mirror Node helpers
// ---------------------------------------------------------------------------

async function fetchInboundMessages(afterSeq) {
  // Mirror Node lets us filter by sequence_number gt via order + limit
  const url = `${MIRROR}/api/v1/topics/${INBOUND_TOPIC}/messages?order=asc&limit=50`;
  const res = await fetch(url);
  const data = await res.json();

  return (data.messages || [])
    .filter((m) => m.sequence_number > afterSeq)
    .map((m) => ({
      seq: m.sequence_number,
      content: (() => {
        try {
          return JSON.parse(
            Buffer.from(m.message, "base64").toString("utf8").trim(),
          );
        } catch {
          return null;
        }
      })(),
      consensusTimestamp: m.consensus_timestamp,
    }))
    .filter((m) => m.content !== null);
}

// ---------------------------------------------------------------------------
// Hedera helpers
// ---------------------------------------------------------------------------

function getClient() {
  return Client.forTestnet().setOperator(
    AGENT_ACCOUNT,
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY),
  );
}

async function postToTopic(topicId, payload) {
  const client = getClient();
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify(payload))
    .execute(client);
  await tx.getReceipt(client);
  return tx.transactionId.toString();
}

// ---------------------------------------------------------------------------
// Groq — answer a free-form question from a peer agent / user
// ---------------------------------------------------------------------------

async function generateHOLResponse(userMessage) {
  const systemPrompt = `You are DevVault AI Assistant, an autonomous agent on the Hedera network.
You help developers with coding questions, Hedera integration, and Web3 development.
Be concise, clear, and technically accurate. Respond in plain text (no markdown headers, 
but code blocks are fine). Keep responses under 400 words unless code is essential.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  const data = await res.json();
  return (
    data.choices?.[0]?.message?.content?.trim() ||
    "I was unable to generate a response at this time."
  );
}

// ---------------------------------------------------------------------------
// Parse operator_id into { returnTopicId, accountId }
// Format: "<topicId>@<accountId>"  e.g. "0.0.12345@0.0.67890"
// ---------------------------------------------------------------------------

function parseOperatorId(operatorId) {
  if (!operatorId || typeof operatorId !== "string") return null;
  const parts = operatorId.split("@");
  if (parts.length !== 2) return null;
  return { returnTopicId: parts[0], accountId: parts[1] };
}

// ---------------------------------------------------------------------------
// Handle a single inbound message
// ---------------------------------------------------------------------------

async function handleMessage(msg) {
  const { seq, content } = msg;

  if (!content || content.p !== "hcs-10") {
    console.log(`   Seq ${seq}: Not an HCS-10 message — skipping.`);
    return;
  }

  const { op, operator_id, data } = content;
  const sender = parseOperatorId(operator_id);

  console.log(`\n📨 Seq ${seq} | op: ${op} | from: ${operator_id}`);

  // ── Connection Request ────────────────────────────────────────────────────
  if (op === "connection_request") {
    // Accept by posting connection_created to our outbound topic
    // and a confirmation to the sender's return topic if we have it
    const confirmPayload = {
      p: "hcs-10",
      op: "connection_created",
      operator_id: `${INBOUND_TOPIC}@${AGENT_ACCOUNT}`,
      connected_account: sender?.accountId || "unknown",
      m: "DevVault AI Assistant accepted your connection.",
    };

    await postToTopic(OUTBOUND_TOPIC, confirmPayload);
    console.log(`   ✅ Accepted connection from ${operator_id}`);

    // Greet on their return topic too, if we can resolve it
    if (sender?.returnTopicId) {
      try {
        await postToTopic(sender.returnTopicId, {
          p: "hcs-10",
          op: "message",
          operator_id: `${INBOUND_TOPIC}@${AGENT_ACCOUNT}`,
          data: "Hello! I'm the DevVault AI Assistant. Send me any developer question and I'll do my best to help. You can also submit questions via the DevVault platform at devvault.vercel.app",
          m: "DevVault AI: connection greeting",
        });
        console.log(`   📬 Greeting sent to ${sender.returnTopicId}`);
      } catch (err) {
        console.warn(`   ⚠️  Could not send greeting: ${err.message}`);
      }
    }

    return;
  }

  // ── Message ───────────────────────────────────────────────────────────────
  if (op === "message") {
    // Decode the data field — may be a plain string or JSON
    let userMessage = "";
    if (typeof data === "string") {
      try {
        const decoded = JSON.parse(
          Buffer.from(data, "base64").toString("utf8"),
        );
        userMessage =
          typeof decoded === "string"
            ? decoded
            : decoded.question || decoded.message || JSON.stringify(decoded);
      } catch {
        // Not base64 JSON — treat as plain text
        userMessage = data;
      }
    } else if (data && typeof data === "object") {
      userMessage = data.question || data.message || JSON.stringify(data);
    }

    if (!userMessage.trim()) {
      console.log(`   Empty message body — skipping.`);
      return;
    }

    console.log(`   Question: "${userMessage.slice(0, 100)}"`);

    // Generate AI response
    const response = await generateHOLResponse(userMessage);
    console.log(`   Response: "${response.slice(0, 100)}..."`);

    const responsePayload = {
      p: "hcs-10",
      op: "message",
      operator_id: `${INBOUND_TOPIC}@${AGENT_ACCOUNT}`,
      data: response,
      m: `DevVault AI reply to seq#${seq}`,
    };

    // Post to our own outbound topic (public activity log)
    const txId = await postToTopic(OUTBOUND_TOPIC, responsePayload);
    console.log(`   ✅ Response logged to outbound | tx: ${txId}`);

    // Deliver directly to sender's return topic if available
    if (sender?.returnTopicId) {
      try {
        await postToTopic(sender.returnTopicId, responsePayload);
        console.log(`   📬 Response delivered to ${sender.returnTopicId}`);
      } catch (err) {
        console.warn(`   ⚠️  Delivery to sender topic failed: ${err.message}`);
      }
    }

    return;
  }

  // ── Unknown op ────────────────────────────────────────────────────────────
  console.log(`   Seq ${seq}: Unknown op "${op}" — skipping.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("📡 DevVault HOL Inbound Handler starting...\n");

  if (!INBOUND_TOPIC || !OUTBOUND_TOPIC) {
    console.error("❌ HOL_INBOUND_TOPIC_ID or HOL_OUTBOUND_TOPIC_ID not set");
    process.exit(1);
  }

  const cursor = loadCursor();
  console.log(`Last processed sequence: ${cursor.lastSeq}`);

  const messages = await fetchInboundMessages(cursor.lastSeq);
  console.log(`New messages to process: ${messages.length}`);

  if (messages.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let maxSeq = cursor.lastSeq;

  for (const msg of messages) {
    try {
      await handleMessage(msg);
      if (msg.seq > maxSeq) maxSeq = msg.seq;
    } catch (err) {
      console.error(`   ❌ Error handling seq ${msg.seq}: ${err.message}`);
    }
  }

  // Persist cursor for next run
  saveCursor({ lastSeq: maxSeq });
  console.log(`\n✅ Done. Cursor advanced to seq ${maxSeq}.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

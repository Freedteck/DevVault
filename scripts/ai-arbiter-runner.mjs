/**
 * DevVault AI Arbiter Runner
 *
 * Runs server-side (GitHub Actions) on a daily cron.
 * Operator key never touches the browser.
 *
 * Flow:
 *   1. Fetch all questions with bounties from HCS
 *   2. Fetch all acceptances — skip questions that already have one
 *   3. For questions older than 7 days with no acceptance: eligible for arbitration
 *   4. Fetch all answers for the eligible question
 *   5. Score each answer via Groq (AI answers use their confidence, human answers get an LLM quality score)
 *   6. Pick the highest-scoring answer
 *   7. Get winner's EVM address from Mirror Node
 *   8. Call arbiterRelease on the escrow smart contract
 *   9. Post result to HCS acceptances topic for the frontend to display
 *
 * Env vars (GitHub Secrets):
 *   HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY
 *   GROQ_API_KEY
 *   PINATA_GATEWAY
 *   QUESTION_TOPIC_ID, ANSWER_TOPIC_ID, ACCEPTANCE_TOPIC_ID
 *   ESCROW_CONTRACT_ID
 */

import {
  Client,
  PrivateKey,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";

const MIRROR = "https://testnet.mirrornode.hedera.com";
const ARBITRATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MODEL = "llama-3.3-70b-versatile";

const QUESTION_TOPIC = process.env.QUESTION_TOPIC_ID;
const ANSWER_TOPIC = process.env.ANSWER_TOPIC_ID;
const ACCEPTANCE_TOPIC = process.env.ACCEPTANCE_TOPIC_ID;
const ESCROW_CONTRACT = process.env.ESCROW_CONTRACT_ID;

// ---------------------------------------------------------------------------
// Mirror Node helpers
// ---------------------------------------------------------------------------

function decodeMessages(rawMessages) {
  return rawMessages
    .map((msg) => {
      try {
        return {
          sequenceNumber: msg.sequence_number,
          content: Buffer.from(msg.message, "base64").toString("utf8").trim(),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function fetchAllMessages(topicId) {
  const all = [];
  let url = `${MIRROR}/api/v1/topics/${topicId}/messages?limit=100&order=asc`;

  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    all.push(...decodeMessages(data.messages || []));
    url = data.links?.next ? `${MIRROR}${data.links.next}` : null;
  }

  return all;
}

async function fetchFromPinata(cid) {
  const res = await fetch(`https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`);
  if (!res.ok) throw new Error(`Pinata fetch failed: ${res.statusText}`);
  return res.json();
}

async function getEvmAddress(accountId) {
  const res = await fetch(`${MIRROR}/api/v1/accounts/${accountId}`);
  const data = await res.json();
  if (!data.evm_address)
    throw new Error(
      `Could not get EVM address for ${accountId}: ${JSON.stringify(data)}`,
    );
  return data.evm_address;
}

// ---------------------------------------------------------------------------
// Groq — evaluate answer quality (0-100)
// ---------------------------------------------------------------------------

async function evaluateAnswerQuality(questionContent, answerContent) {
  try {
    const prompt = `You are evaluating the quality of a developer's answer to a technical question.

Question: ${questionContent}

Answer: ${answerContent}

Score this answer from 0-100 based on:
1. Does it actually answer the question? (30 points)
2. Is the code/solution correct and functional? (30 points)
3. Is the explanation complete and clear? (20 points)
4. Does it follow best practices? (20 points)

Return ONLY a number between 0-100. No explanation.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "You are an expert code reviewer. Return only a numeric score.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "50";
    const score = parseInt(text);
    return isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
  } catch {
    return 50;
  }
}

// ---------------------------------------------------------------------------
// Hedera helpers
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

async function callArbiterRelease(numericQuestionId, recipientEvmAddress) {
  const client = getClient();

  const tx = await new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(ESCROW_CONTRACT))
    .setGas(300000)
    .setFunction(
      "arbiterRelease",
      new ContractFunctionParameters()
        .addUint256(numericQuestionId)
        .addAddress(recipientEvmAddress),
    )
    .execute(client);

  const receipt = await tx.getReceipt(client);
  console.log(`   Contract status: ${receipt.status}`);
  return tx.transactionId.toString();
}

// ---------------------------------------------------------------------------
// Core arbitration logic
// ---------------------------------------------------------------------------

async function arbitrateQuestion(question, answers) {
  const { questionId, title, description } = question;
  const questionContent = `${title}\n\n${description || ""}`;

  console.log(`\n⚖️  Arbitrating: ${questionId}`);
  console.log(`   "${title}"`);
  console.log(`   ${answers.length} answer(s) to evaluate`);

  if (answers.length === 0) {
    console.log("   No answers — skipping.");
    return;
  }

  // Score every answer
  const scored = await Promise.all(
    answers.map(async (answer) => {
      // AI answers: trust their own confidence score
      // Human answers: evaluate with Groq
      const score =
        answer.isAI && answer.confidence != null
          ? answer.confidence
          : await evaluateAnswerQuality(questionContent, answer.content || "");

      console.log(
        `   ${answer.isAI ? "🤖" : "👤"} ${answer.author} → score: ${score}`,
      );
      return { ...answer, arbitrationScore: score };
    }),
  );

  const best = scored.sort(
    (a, b) => b.arbitrationScore - a.arbitrationScore,
  )[0];
  console.log(`   🏆 Best: ${best.author} (${best.arbitrationScore})`);

  // Get numeric key used when the escrow was deposited
  // questionId format: "q-<timestamp>-<accountNum>" → segment [1] is the timestamp
  const segments = questionId.toString().split("-");
  const numericKey =
    segments.length >= 2 && /^\d+$/.test(segments[1])
      ? segments[1]
      : questionId.replace(/\D/g, "");

  // Get winner EVM address
  const winnerAccountId =
    typeof best.author === "object" ? best.author.username : best.author;
  const recipientEvmAddress = await getEvmAddress(winnerAccountId);

  // Release escrow
  const txId = await callArbiterRelease(numericKey, recipientEvmAddress);
  console.log(`   ✅ Escrow released to ${winnerAccountId} | tx: ${txId}`);

  // Record arbitration result to HCS acceptances topic
  // (frontend can read this to mark the question as resolved)
  await postToHCS(ACCEPTANCE_TOPIC, {
    type: "acceptance",
    questionId,
    answerId: best.answerId,
    acceptedBy: "ai-arbiter",
    arbitrationScore: best.arbitrationScore,
    timestamp: Date.now(),
  });

  console.log("   📝 Arbitration recorded to HCS.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("⚖️  DevVault AI Arbiter starting...\n");

  if (
    !QUESTION_TOPIC ||
    !ANSWER_TOPIC ||
    !ACCEPTANCE_TOPIC ||
    !ESCROW_CONTRACT
  ) {
    console.error(
      "❌ Missing required env vars: QUESTION_TOPIC_ID, ANSWER_TOPIC_ID, ACCEPTANCE_TOPIC_ID, ESCROW_CONTRACT_ID",
    );
    process.exit(1);
  }

  const gateway = process.env.PINATA_GATEWAY;

  // Fetch all data from HCS in parallel
  const [questionMessages, answerMessages, acceptanceMessages] =
    await Promise.all([
      fetchAllMessages(QUESTION_TOPIC),
      fetchAllMessages(ANSWER_TOPIC),
      fetchAllMessages(ACCEPTANCE_TOPIC),
    ]);

  console.log(
    `Fetched: ${questionMessages.length} questions, ${answerMessages.length} answers, ${acceptanceMessages.length} acceptances`,
  );

  // Build answer lookup map: questionId → [answers with content]
  const answersByQuestion = {};
  for (const msg of answerMessages) {
    try {
      const meta = JSON.parse(msg.content);
      if (!answersByQuestion[meta.questionId]) {
        answersByQuestion[meta.questionId] = [];
      }
      answersByQuestion[meta.questionId].push(meta);
    } catch {}
  }

  // Build accepted question IDs set
  const acceptedQuestionIds = new Set();
  for (const msg of acceptanceMessages) {
    try {
      const acc = JSON.parse(msg.content);
      acceptedQuestionIds.add(acc.questionId);
    } catch {}
  }

  // Process eligible questions
  let arbitrated = 0;

  for (const msg of questionMessages) {
    try {
      const meta = JSON.parse(msg.content);
      if (meta.type !== "question") continue;

      // Must have a bounty
      if (!meta.bounty || meta.bounty <= 0) continue;

      // Must not be already accepted/arbitrated
      if (acceptedQuestionIds.has(meta.questionId)) continue;

      // Must be older than 7 days
      const age = Date.now() - meta.timestamp;
      if (age < ARBITRATION_WINDOW_MS) {
        const daysLeft = ((ARBITRATION_WINDOW_MS - age) / 86400000).toFixed(1);
        console.log(
          `   ⏳ ${meta.questionId} — ${daysLeft} day(s) until eligible`,
        );
        continue;
      }

      // Fetch full question content from Pinata
      const fullContent = await fetchFromPinata(meta.cid);
      const question = {
        questionId: meta.questionId,
        title: meta.title,
        description: fullContent.description || "",
      };

      // Fetch full answer content
      const rawAnswers = answersByQuestion[meta.questionId] || [];
      const answers = await Promise.all(
        rawAnswers.map(async (a) => {
          try {
            const ac = await fetchFromPinata(a.cid);
            return {
              answerId: a.answerId,
              author: a.author,
              content: ac.content || "",
              isAI: a.isAI || false,
              confidence: a.confidence || null,
            };
          } catch {
            return null;
          }
        }),
      );

      await arbitrateQuestion(question, answers.filter(Boolean));
      arbitrated++;
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }
  }

  console.log(`\n✅ Done. Arbitrated ${arbitrated} question(s).`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

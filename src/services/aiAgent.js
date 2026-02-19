import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { HederaLangchainToolkit, AgentMode } from "hedera-agent-kit";
import { ChatGroq } from "@langchain/groq";
import { uploadJsonToPinata } from "./pinata.js";
import { submitMessageOperator } from "./createMessageOperator.js";
import { TOPICS } from "./constants.js";

/**
 * AI Agent Service - Generates answers using Groq via Hedera Agent Kit
 *
 * Responsibilities:
 * 1. Generate instant answers to questions
 * 2. Calculate confidence scores
 * 3. Post answers when confidence ≥50%
 * 4. Use HOL-registered agent identity (VITE_AGENT_ACCOUNT_ID) when available,
 *    falling back to operator account for local dev
 *
 * After running scripts/register-hol-agent.cjs, set in .env.local:
 *   VITE_AGENT_ACCOUNT_ID, VITE_AGENT_PRIVATE_KEY,
 *   VITE_AGENT_INBOUND_TOPIC_ID, VITE_AGENT_OUTBOUND_TOPIC_ID
 */

// AI Agent account configuration — prefers the HOL-registered dedicated account
const AI_AGENT_CONFIG = {
  accountId:
    import.meta.env.VITE_AGENT_ACCOUNT_ID || import.meta.env.VITE_MY_ACCOUNT_ID,
  privateKey:
    import.meta.env.VITE_AGENT_PRIVATE_KEY ||
    import.meta.env.VITE_MY_PRIVATE_KEY,
  // HOL outbound topic — empty string means logging is skipped
  outboundTopicId: import.meta.env.VITE_AGENT_OUTBOUND_TOPIC_ID || "",
  inboundTopicId: import.meta.env.VITE_AGENT_INBOUND_TOPIC_ID || "",
  name: "DevVault AI Assistant",
  model: "llama-3.3-70b-versatile",
};

let hederaClient = null;
let hederaToolkit = null;
let llm = null;

/**
 * Initialize Hedera Agent Kit with Groq LLM
 */
async function initializeHederaAgentKit() {
  if (hederaClient && llm)
    return { client: hederaClient, toolkit: hederaToolkit, llm };

  try {
    // Create Hedera client
    hederaClient = Client.forTestnet().setOperator(
      AI_AGENT_CONFIG.accountId,
      PrivateKey.fromStringECDSA(AI_AGENT_CONFIG.privateKey),
    );

    // Initialize Groq LLM via LangChain
    llm = new ChatGroq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      model: AI_AGENT_CONFIG.model,
      temperature: 0.3,
    });

    // Initialize Hedera Agent Kit
    hederaToolkit = new HederaLangchainToolkit({
      client: hederaClient,
      configuration: {
        tools: [],
        plugins: [],
        context: {
          mode: AgentMode.AUTONOMOUS,
        },
      },
    });

    console.log(`✅ AI Agent initialized: ${AI_AGENT_CONFIG.accountId}`);
    return { client: hederaClient, toolkit: hederaToolkit, llm };
  } catch (error) {
    console.error("Failed to initialize Hedera Agent Kit:", error);
    throw error;
  }
}

/**
 * Generate AI answer for a question
 * @param {object} question - Question data { title, description, tags, codeSnippet }
 * @returns {Promise<object>} - { answer, confidence, reasoning }
 */
export async function generateAnswer(question) {
  const { title, description, codeSnippet, tags } = question;

  try {
    // Initialize LLM if not already
    const { llm: groqLLM } = await initializeHederaAgentKit();

    const systemPrompt = `You are DevVault AI Assistant, a helpful coding assistant that answers developer questions.

CRITICAL RULES:
1. Only answer if you are confident (≥50%) about the solution
2. Provide clear, actionable answers with code examples when relevant
3. Admit uncertainty - say "I'm not confident enough" if confidence <50%
4. Include confidence percentage at the end: "Confidence: XX%"

Your response format:
[Your answer here with code examples if needed]

Confidence: XX%
Reasoning: [Why you're confident or not]`;

    const userPrompt = `Question: ${title}

${description ? `Details: ${description}` : ""}

${codeSnippet ? `Code:\n\`\`\`\n${codeSnippet}\n\`\`\`` : ""}

${tags && tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}

Please provide a comprehensive answer.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const completion = await groqLLM.invoke(messages);
    const response = completion.content || "";

    // Parse confidence and reasoning
    const confidenceMatch = response.match(/Confidence:\s*(\d+)%/i);
    const reasoningMatch = response.match(/Reasoning:\s*(.+?)(?:\n\n|$)/is);

    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
    const reasoning = reasoningMatch
      ? reasoningMatch[1].trim()
      : "No reasoning provided";

    // Remove confidence and reasoning from answer
    const answer = response
      .replace(/Confidence:\s*\d+%/gi, "")
      .replace(/Reasoning:\s*.+$/is, "")
      .trim();

    return {
      answer,
      confidence,
      reasoning,
    };
  } catch (error) {
    console.error("Error generating AI answer:", error);
    throw error;
  }
}

/**
 * Process question and post AI answer if confident
 * @param {object} question - Question data
 * @param {string} questionId - Question ID from HCS
 * @returns {Promise<object|null>} - Answer data if posted, null if not confident
 */
export async function processQuestion(question, questionId) {
  try {
    console.log(`🤖 AI Agent processing question: ${questionId}`);

    // Generate answer
    const { answer, confidence, reasoning } = await generateAnswer(question);

    console.log(`   Confidence: ${confidence}%`);
    console.log(`   Reasoning: ${reasoning}`);

    // Only post if confidence ≥50%
    if (confidence < 50) {
      console.log(`   ⚠️  Confidence too low. Routing to humans.`);
      return null;
    }

    // Initialize Hedera Agent Kit if not already
    const { client } = await initializeHederaAgentKit();

    // Upload answer content to Pinata
    const contentForPinata = { content: answer };
    const pinataUrl = await uploadJsonToPinata(contentForPinata);
    const cid = pinataUrl.split("/ipfs/")[1];

    // Create HCS metadata
    const answerId = `a-${Date.now()}-${AI_AGENT_CONFIG.accountId.split(".")[2]}`;
    const hcsMetadata = {
      type: "answer",
      answerId,
      questionId,
      author: AI_AGENT_CONFIG.accountId,
      isAI: true,
      confidence,
      cid,
      timestamp: Date.now(),
    };

    // Submit to HCS using operator mode
    const [status, transactionId] = await submitMessageOperator(
      client,
      TOPICS.ANSWERS,
      hcsMetadata,
    );

    console.log(`   ✅ AI answer posted to HCS (${confidence}% confidence)`);
    console.log(`   Transaction: ${transactionId}`);
    console.log(`   Answer ID: ${answerId}`);

    // Log activity to HOL outbound topic (HCS-10 protocol) — runs if configured
    if (AI_AGENT_CONFIG.outboundTopicId) {
      try {
        const operatorId = AI_AGENT_CONFIG.inboundTopicId
          ? `${AI_AGENT_CONFIG.inboundTopicId}@${AI_AGENT_CONFIG.accountId}`
          : AI_AGENT_CONFIG.accountId;

        const holMessage = {
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
          m: `DevVault AI: answered question ${questionId} (${confidence}% confidence)`,
        };

        const outboundTx = await new TopicMessageSubmitTransaction()
          .setTopicId(AI_AGENT_CONFIG.outboundTopicId)
          .setMessage(JSON.stringify(holMessage))
          .setTransactionMemo("hcs-10:op:6:2")
          .execute(client);

        await outboundTx.getReceipt(client);
        console.log(`   📡 HOL activity logged to outbound topic`);
      } catch (holErr) {
        // Non-critical — don't fail the whole answer over this
        console.warn(
          "   ⚠️  Could not log to HOL outbound topic:",
          holErr.message,
        );
      }
    }

    return {
      answerId,
      answer,
      confidence,
      reasoning,
      accountId: AI_AGENT_CONFIG.accountId,
      transactionId: transactionId.toString(),
      cid,
      status,
    };
  } catch (error) {
    console.error("Error processing question:", error);
    return null;
  }
}

/**
 * Get AI agent account ID
 * @returns {string} - AI agent account ID
 */
export function getAIAgentAccountId() {
  return AI_AGENT_CONFIG.accountId;
}

/**
 * Get AI agent configuration
 * @returns {object} - AI agent config
 */
export function getAIAgentConfig() {
  return {
    accountId: AI_AGENT_CONFIG.accountId,
    name: AI_AGENT_CONFIG.name,
    model: AI_AGENT_CONFIG.model,
  };
}

export default {
  generateAnswer,
  processQuestion,
  getAIAgentAccountId,
  getAIAgentConfig,
  initializeHederaAgentKit,
};

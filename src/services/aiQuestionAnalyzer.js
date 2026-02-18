import { Client, PrivateKey } from "@hashgraph/sdk";
import { HederaLangchainToolkit, AgentMode } from "hedera-agent-kit";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";

/**
 * AI Question Analyzer - Analyzes questions and generates instant answers
 *
 * Uses Hedera Agent Kit with Groq LLM (via LangChain)
 */

/**
 * Initialize Hedera client with operator account
 */
function getHederaClient() {
  const accountId = import.meta.env.VITE_MY_ACCOUNT_ID;
  const privateKey = import.meta.env.VITE_MY_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error("Missing VITE_MY_ACCOUNT_ID or VITE_MY_PRIVATE_KEY");
  }

  return Client.forTestnet().setOperator(
    accountId,
    PrivateKey.fromStringECDSA(privateKey),
  );
}

/**
 * Create AI agent with Hedera tools
 */
function createHederaAgent() {
  const client = getHederaClient();

  // Prepare Hedera toolkit
  const hederaToolkit = new HederaLangchainToolkit({
    client,
    configuration: {
      tools: [],
      plugins: [],
      context: {
        mode: AgentMode.AUTONOMOUS,
      },
    },
  });

  const tools = hederaToolkit.getTools();

  // Use Groq LLM via LangChain
  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    temperature: 0.3,
  });

  const agent = createAgent({
    model: llm,
    tools: tools,
    systemPrompt: `You are a helpful developer assistant that answers technical questions. 
Be concise and accurate. If you don't know something, say so.`,
    checkpointer: new MemorySaver(),
  });

  return agent;
}

/**
 * Analyze question complexity
 * @param {string} questionText - The question content
 * @returns {Promise<object>} - { complexity: 'simple'|'complex', reasoning: string }
 */
export async function analyzeQuestionComplexity(questionText) {
  try {
    const agent = createHederaAgent();

    const prompt = `Analyze this developer question and determine if it's SIMPLE or COMPLEX.

Question: ${questionText}

SIMPLE = Can be answered with basic knowledge, syntax, or common patterns
COMPLEX = Requires debugging, architecture decisions, or deep expertise

Respond in JSON format:
{
  "complexity": "simple" or "complex",
  "reasoning": "brief explanation"
}`;

    const response = await agent.invoke(
      { messages: [{ role: "user", content: prompt }] },
      { configurable: { thread_id: Date.now().toString() } },
    );

    const content = response.messages[response.messages.length - 1].content;

    // Try to parse JSON response
    try {
      const result = JSON.parse(content);
      return {
        complexity: result.complexity === "simple" ? "simple" : "complex",
        reasoning: result.reasoning || "No reasoning provided",
      };
    } catch {
      // Fallback if JSON parsing fails
      const isSimple = content.toLowerCase().includes("simple");
      return {
        complexity: isSimple ? "simple" : "complex",
        reasoning: content.substring(0, 200),
      };
    }
  } catch (error) {
    console.error("Error analyzing question complexity:", error);
    // Default to complex on error (route to humans)
    return {
      complexity: "complex",
      reasoning: "Error analyzing question, routing to human experts",
    };
  }
}

/**
 * Generate answer for simple questions
 * @param {string} questionText - The question content
 * @returns {Promise<object>} - { answer: string, confidence: number }
 */
export async function generateAnswer(questionText) {
  try {
    const agent = createHederaAgent();

    const prompt = `Answer this developer question clearly and concisely:

${questionText}

Provide your answer followed by your confidence level (0-100).

Format:
ANSWER: [your detailed answer here]
CONFIDENCE: [number between 0-100]`;

    const response = await agent.invoke(
      { messages: [{ role: "user", content: prompt }] },
      { configurable: { thread_id: Date.now().toString() } },
    );

    const content = response.messages[response.messages.length - 1].content;

    // Extract answer and confidence
    const answerMatch = content.match(/ANSWER:\s*([\s\S]*?)(?=CONFIDENCE:|$)/i);
    const confidenceMatch = content.match(/CONFIDENCE:\s*(\d+)/i);

    const answer = answerMatch ? answerMatch[1].trim() : content;
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

    return {
      answer,
      confidence: Math.min(100, Math.max(0, confidence)),
    };
  } catch (error) {
    console.error("Error generating answer:", error);
    return {
      answer: "Unable to generate answer at this time.",
      confidence: 0,
    };
  }
}

/**
 * Analyze question and generate answer if simple enough
 * @param {string} questionText - The question content
 * @returns {Promise<object>} - { shouldAnswer: boolean, answer?: string, confidence?: number, reasoning: string }
 */
export async function analyzeAndAnswer(questionText) {
  console.log("🤖 AI analyzing question...");

  // Step 1: Check complexity
  const complexityResult = await analyzeQuestionComplexity(questionText);
  console.log(`   Complexity: ${complexityResult.complexity}`);

  if (complexityResult.complexity === "complex") {
    return {
      shouldAnswer: false,
      reasoning: complexityResult.reasoning,
    };
  }

  // Step 2: Generate answer for simple questions
  const answerResult = await generateAnswer(questionText);
  console.log(`   Confidence: ${answerResult.confidence}%`);

  if (answerResult.confidence >= 50) {
    return {
      shouldAnswer: true,
      answer: answerResult.answer,
      confidence: answerResult.confidence,
      reasoning: "AI confident enough to provide instant answer",
    };
  } else {
    return {
      shouldAnswer: false,
      reasoning: "AI confidence too low, routing to human experts",
    };
  }
}

export default {
  analyzeQuestionComplexity,
  generateAnswer,
  analyzeAndAnswer,
};

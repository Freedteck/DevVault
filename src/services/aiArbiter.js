/* eslint-disable no-undef */
import {
  Client,
  PrivateKey,
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractFunctionParameters,
  ContractId,
} from "@hashgraph/sdk";
import { ChatGroq } from "@langchain/groq";

/**
 * AI Arbiter Service - Handles automatic bounty releases after 7-day timeout
 *
 * Responsibilities:
 * 1. Check for expired bounties (7 days with no acceptance)
 * 2. Evaluate answers using AI and select best one
 * 3. Release bounty to best answer author
 * 4. Post arbitration result to HCS
 */

const ARBITRATION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Get Groq LLM instance for answer evaluation
 */
function getGroqLLM() {
  return new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    temperature: 0.3,
  });
}

/**
 * Check if question bounty is eligible for arbitration
 * @param {object} question - Question with bounty
 * @param {Array} acceptances - Array of acceptance events
 * @returns {boolean} - True if eligible for AI arbitration
 */
export function isEligibleForArbitration(question, acceptances) {
  // Must have bounty
  if (!question.bounty || question.bounty <= 0) {
    return false;
  }

  // Must not have been accepted
  const hasAcceptance = acceptances.some(
    (a) => a.questionId === question.questionId,
  );
  if (hasAcceptance) {
    return false;
  }

  // Must be older than 7 days
  const questionAge = Date.now() - question.timestamp;
  if (questionAge < ARBITRATION_TIMEOUT) {
    return false;
  }

  return true;
}

/**
 * Calculate time until arbitration
 * @param {number} questionTimestamp - Question creation timestamp
 * @returns {number} - Milliseconds until arbitration (0 if eligible now)
 */
export function getTimeUntilArbitration(questionTimestamp) {
  const arbitrationTime = questionTimestamp + ARBITRATION_TIMEOUT;
  const remaining = arbitrationTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Evaluate human answer quality using AI
 * @param {string} questionContent - The original question
 * @param {string} answerContent - The answer to evaluate
 * @returns {Promise<number>} - Quality score (0-100)
 */
async function evaluateAnswerQuality(questionContent, answerContent) {
  try {
    const llm = getGroqLLM();

    const prompt = `You are evaluating the quality of a developer's answer to a technical question.

Question: ${questionContent}

Answer: ${answerContent}

Score this answer from 0-100 based on:
1. Does it actually answer the question? (30 points)
2. Is the code/solution correct and functional? (30 points)
3. Is the explanation complete and clear? (20 points)
4. Does it follow best practices? (20 points)

Return ONLY a number between 0-100. No explanation needed.`;

    const response = await llm.invoke([
      {
        role: "system",
        content:
          "You are an expert code reviewer. Return only a numeric score.",
      },
      { role: "user", content: prompt },
    ]);

    const content = response.content;
    const score = parseInt(content.trim());

    // Validate score
    if (isNaN(score) || score < 0 || score > 100) {
      console.warn(`Invalid score received: ${content}, defaulting to 50`);
      return 50;
    }

    return score;
  } catch (error) {
    console.error("Error evaluating answer quality:", error);
    return 50; // Default to middle score on error
  }
}

/**
 * Select best answer for arbitration
 * AI answers use confidence, human answers get AI quality evaluation
 * @param {Array} answers - Array of answers to the question
 * @param {string} questionContent - The original question content
 * @returns {Promise<object|null>} - Best answer or null if no answers
 */
export async function selectBestAnswer(answers, questionContent) {
  if (!answers || answers.length === 0) {
    return null;
  }

  console.log(`🔍 AI Arbiter evaluating ${answers.length} answers...`);

  // Score each answer
  const scored = await Promise.all(
    answers.map(async (answer) => {
      let score = 0;

      if (answer.isAI && answer.confidence) {
        // AI answers: use their confidence score
        score = answer.confidence;
        console.log(`   AI answer: ${score} (confidence)`);
      } else {
        // Human answers: evaluate quality with AI
        score = await evaluateAnswerQuality(questionContent, answer.content);
        console.log(`   Human answer by ${answer.author}: ${score} (quality)`);
      }

      return { ...answer, arbitrationScore: score };
    }),
  );

  // Sort by score and return best
  scored.sort((a, b) => b.arbitrationScore - a.arbitrationScore);

  const authorLabel =
    scored[0].author?.username ||
    scored[0].author?.toString() ||
    scored[0].author;
  console.log(
    `   ✅ Best answer: ${authorLabel} (score: ${scored[0].arbitrationScore})`,
  );

  return scored[0];
}

/**
 * Execute arbitration - release bounty to best answer
 * @param {string} contractId - Escrow contract ID
 * @param {number} questionId - Question escrow ID
 * @param {string} recipientAccountId - Winner's account ID
 * @returns {Promise<string>} - Transaction ID
 */
export async function executeArbitration(
  contractId,
  questionId,
  recipientAccountId,
) {
  try {
    console.log(
      `🔨 AI Arbiter executing arbitration for question ${questionId}`,
    );
    console.log(`   Winner: ${recipientAccountId}`);

    // Create Hedera client with operator account
    const accountId = import.meta.env.VITE_MY_ACCOUNT_ID;
    const privateKey = import.meta.env.VITE_MY_PRIVATE_KEY;

    const client = Client.forTestnet().setOperator(
      accountId,
      PrivateKey.fromStringECDSA(privateKey),
    );

    // Get the actual EVM address from mirror node (same as escrowService.js)
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${recipientAccountId}`;
    const accountResponse = await fetch(mirrorNodeUrl);
    const accountData = await accountResponse.json();
    const recipientAddress = accountData.evm_address;
    console.log(`   Recipient EVM address: ${recipientAddress}`);

    // Pre-flight: query the escrow to confirm it exists and is eligible before executing
    try {
      const checkQuery = new ContractCallQuery()
        .setContractId(ContractId.fromString(contractId))
        .setGas(100000)
        .setFunction(
          "isEligibleForArbitration",
          new ContractFunctionParameters().addUint256(questionId),
        );
      const checkResult = await checkQuery.execute(client);
      const isEligible = checkResult.getBool(0);
      if (!isEligible) {
        // Also fetch escrow details to explain why
        const escrowQuery = new ContractCallQuery()
          .setContractId(ContractId.fromString(contractId))
          .setGas(100000)
          .setFunction(
            "getEscrow",
            new ContractFunctionParameters().addUint256(questionId),
          );
        const escrowResult = await escrowQuery.execute(client);
        const amount = escrowResult.getUint256(1);
        const released = escrowResult.getBool(3);
        const createdAt = escrowResult.getUint256(4);
        throw new Error(
          `Escrow not eligible for arbitration. amount=${amount}, released=${released}, createdAt=${createdAt}, questionId=${questionId}`,
        );
      }
    } catch (preflightError) {
      // Re-throw informative errors; ignore query errors caused by non-existent escrow
      if (preflightError.message?.startsWith("Escrow not eligible")) {
        throw preflightError;
      }
      console.warn(
        "Pre-flight check failed (proceeding anyway):",
        preflightError.message,
      );
    }

    // Call arbiterRelease on the contract
    const arbiterReleaseTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(300000)
      .setFunction(
        "arbiterRelease",
        new ContractFunctionParameters()
          .addUint256(questionId)
          .addAddress(recipientAddress),
      );

    const txResponse = await arbiterReleaseTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(`   ✅ Arbitration executed: ${txResponse.transactionId}`);
    console.log(`   Status: ${receipt.status}`);

    return txResponse.transactionId.toString();
  } catch (error) {
    console.error("Error executing arbitration:", error);
    throw error;
  }
}

/**
 * Process arbitration for a question
 * Full workflow: check eligibility, select winner, execute release
 * @param {object} question - Question data (must include content)
 * @param {Array} answers - Answers to the question
 * @param {Array} acceptances - Acceptance events
 * @returns {Promise<object|null>} - Arbitration result or null if not eligible
 */
export async function processArbitration(question, answers, acceptances) {
  try {
    // Check if eligible
    if (!isEligibleForArbitration(question, acceptances)) {
      return null;
    }

    // Select best answer using AI evaluation
    const bestAnswer = await selectBestAnswer(answers, question.description);
    if (!bestAnswer) {
      console.log(
        `⚠️  No answers to arbitrate for question ${question.questionId}`,
      );
      return null;
    }

    const authorLabel =
      bestAnswer.author?.username ||
      bestAnswer.author?.toString() ||
      bestAnswer.author;
    console.log(`🔨 AI Arbiter selected answer from ${authorLabel}`);
    console.log(`   Score: ${bestAnswer.arbitrationScore}`);

    // Execute arbitration on smart contract
    const escrowContractId = import.meta.env.VITE_ESCROW_CONTRACT_ID;
    if (!escrowContractId) {
      throw new Error("Escrow contract ID not configured");
    }

    // Convert questionId to the same numeric key used during escrow deposit.
    // escrowService.js deposits with: parseInt(questionId.split("-")[1])
    // questionId format: "q-<timestamp>-<accountNum>" → segment [1] is the timestamp.
    const rawId = question.questionId.toString();
    const segments = rawId.split("-");
    // Use segment [1] if it exists and is numeric, otherwise fall back to the whole string
    const numericQuestionId =
      segments.length >= 2 && /^\d+$/.test(segments[1])
        ? segments[1]
        : rawId.replace(/\D/g, "");
    console.log(`   Numeric escrow key: ${numericQuestionId} (from ${rawId})`);

    const transactionId = await executeArbitration(
      escrowContractId,
      numericQuestionId,
      bestAnswer.author.username || bestAnswer.author,
    );

    return {
      questionId: question.questionId,
      winnerId: bestAnswer.answerId,
      winnerAccountId: bestAnswer.author,
      arbitrationScore: bestAnswer.arbitrationScore,
      isAIWinner: bestAnswer.isAI || false,
      transactionId,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error processing arbitration:", error);
    throw error;
  }
}

/**
 * Scan for questions needing arbitration
 * This should be called periodically (e.g., via cron job)
 * @param {Array} questions - All questions with bounties
 * @param {Array} allAnswers - Map of questionId -> answers
 * @param {Array} acceptances - All acceptance events
 * @returns {Promise<Array>} - Array of arbitration results
 */
export async function scanAndArbitrate(questions, allAnswers, acceptances) {
  const results = [];

  for (const question of questions) {
    try {
      const answers = allAnswers[question.questionId] || [];
      const result = await processArbitration(question, answers, acceptances);

      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(
        `Error arbitrating question ${question.questionId}:`,
        error,
      );
    }
  }

  return results;
}

export default {
  isEligibleForArbitration,
  getTimeUntilArbitration,
  selectBestAnswer,
  executeArbitration,
  processArbitration,
  scanAndArbitrate,
  ARBITRATION_TIMEOUT,
};

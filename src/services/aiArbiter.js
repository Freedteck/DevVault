import { Client, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters } from "@hashgraph/sdk";

/**
 * AI Arbiter Service - Handles automatic bounty releases after 7-day timeout
 * 
 * Responsibilities:
 * 1. Check for expired bounties (7 days with no acceptance)
 * 2. Evaluate answers and select best one
 * 3. Release bounty to best answer author
 * 4. Post arbitration result to HCS
 */

const ARBITRATION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// AI Arbiter account configuration
const AI_ARBITER_CONFIG = {
  accountId: import.meta.env.VITE_AGENT_ACCOUNT_ID || import.meta.env.VITE_MY_ACCOUNT_ID,
  privateKey: import.meta.env.VITE_AGENT_PRIVATE_KEY || import.meta.env.VITE_MY_PRIVATE_KEY,
};

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
  const hasAcceptance = acceptances.some((a) => a.questionId === question.questionId);
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
 * Select best answer for arbitration
 * Uses scoring: AI confidence vs human base score
 * @param {Array} answers - Array of answers to the question
 * @returns {object|null} - Best answer or null if no answers
 */
export function selectBestAnswer(answers) {
  if (!answers || answers.length === 0) {
    return null;
  }

  // Score each answer
  const scored = answers.map((answer) => {
    let score = 0;

    // AI answers: use confidence score
    if (answer.isAI && answer.confidence) {
      score = answer.confidence;
    } else {
      // Human answers: base score of 70
      // Could be enhanced later with quality metrics
      score = 70;
    }

    return { ...answer, arbitrationScore: score };
  });

  // Sort by score and return best
  scored.sort((a, b) => b.arbitrationScore - a.arbitrationScore);
  return scored[0];
}

/**
 * Execute arbitration - release bounty to best answer
 * @param {string} contractId - Escrow contract ID
 * @param {number} questionId - Question escrow ID
 * @param {string} recipientAccountId - Winner's account ID
 * @returns {Promise<string>} - Transaction ID
 */
export async function executeArbitration(contractId, questionId, recipientAccountId) {
  try {
    console.log(`🔨 AI Arbiter executing arbitration for question ${questionId}`);
    console.log(`   Winner: ${recipientAccountId}`);

    // Create Hedera client with AI arbiter credentials
    const client = Client.forTestnet().setOperator(
      AI_ARBITER_CONFIG.accountId,
      PrivateKey.fromStringECDSA(AI_ARBITER_CONFIG.privateKey)
    );

    // Convert recipient to EVM address for contract call
    const recipientAddress = `0x${Buffer.from(recipientAccountId.split(".")[2]).toString("hex").padStart(40, "0")}`;

    // Call arbiterRelease on the contract
    const arbiterReleaseTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction(
        "arbiterRelease",
        new ContractFunctionParameters()
          .addUint256(questionId)
          .addAddress(recipientAddress)
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
 * @param {object} question - Question data
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

    // Select best answer
    const bestAnswer = selectBestAnswer(answers);
    if (!bestAnswer) {
      console.log(`⚠️  No answers to arbitrate for question ${question.questionId}`);
      return null;
    }

    console.log(`🔨 AI Arbiter selected answer from ${bestAnswer.author}`);
    console.log(`   Score: ${bestAnswer.arbitrationScore}`);

    // Execute arbitration on smart contract
    const escrowContractId = import.meta.env.VITE_ESCROW_CONTRACT_ID;
    if (!escrowContractId) {
      throw new Error("Escrow contract ID not configured");
    }

    const transactionId = await executeArbitration(
      escrowContractId,
      question.escrowId,
      bestAnswer.author
    );

    return {
      questionId: question.questionId,
      winnerId: bestAnswer.answerId,
      winnerAccountId: bestAnswer.author,
      arbitrationScore: bestAnswer.arbitrationScore,
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
      console.error(`Error arbitrating question ${question.questionId}:`, error);
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

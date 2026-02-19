import { submitMessage } from "./createMessage.js";
import { uploadJsonToPinata } from "./pinata.js";
import { TOPICS } from "./constants.js";
import { depositBountyToEscrow, releaseEscrow } from "./escrowService.js";

export { releaseEscrow };

/**
 * HCS Service - Handles submission of different content types
 * Splits large content (Pinata) from metadata (HCS)
 */

/**
 * Submit Question
 * @param {object} questionData - { title, description, codeSnippet, tags, bounty }
 * @param {object} dAppConnector - DAppConnector instance
 * @param {string} accountId - User's account ID
 * @returns {Promise<object>} - { questionId, transactionId, cid, escrowTxId? }
 */
export async function submitQuestion(questionData, dAppConnector, accountId) {
  const { title, description, codeSnippet, tags, bounty } = questionData;

  // 1. Upload full content to Pinata
  const contentForPinata = {
    description,
    codeSnippet: codeSnippet || null,
  };

  const pinataUrl = await uploadJsonToPinata(contentForPinata);
  const cid = pinataUrl.split("/ipfs/")[1]; // Extract CID from URL

  // 2. Create metadata for HCS (lightweight)
  const questionId = `q-${Date.now()}-${accountId.split(".")[2]}`;
  const hcsMetadata = {
    type: "question",
    questionId,
    title,
    author: accountId,
    tags: tags || [],
    bounty: bounty || 0,
    cid, // Pointer to Pinata content
    timestamp: Date.now(),
  };

  // 3. Submit to HCS
  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.QUESTIONS,
    hcsMetadata,
  );

  const result = {
    questionId,
    transactionId: transactionId.toString(),
    cid,
    status: status,
  };

  // 4. If bounty > 0, deposit to escrow contract
  if (bounty && bounty > 0) {
    try {
      const escrowContractId = import.meta.env.VITE_ESCROW_CONTRACT_ID;
      if (!escrowContractId) {
        console.warn(
          "⚠️ VITE_ESCROW_CONTRACT_ID not set, skipping escrow deposit",
        );
      } else {
        const escrowResult = await depositBountyToEscrow(
          dAppConnector,
          accountId,
          escrowContractId,
          questionId,
          bounty,
        );
        result.escrowTxId = escrowResult.transactionId.toString();
        console.log(`✅ Bounty deposited to escrow: ${result.escrowTxId}`);
      }
    } catch (escrowError) {
      console.error("❌ Escrow deposit failed:", escrowError);
      // Don't fail the whole question submission if escrow fails
      result.escrowError = escrowError.message;
    }
  }

  return result;
}

/**
 * Submit Answer
 * @param {object} answerData - { questionId, content, isAI, confidence }
 * @param {object} dAppConnector - DAppConnector instance
 * @param {string} accountId - User's account ID
 * @returns {Promise<object>} - { answerId, transactionId, cid }
 */
export async function submitAnswer(answerData, dAppConnector, accountId) {
  const { questionId, content, isAI = false, confidence = null } = answerData;

  // 1. Upload full content to Pinata
  const contentForPinata = {
    content,
  };

  const pinataUrl = await uploadJsonToPinata(contentForPinata);
  const cid = pinataUrl.split("/ipfs/")[1];

  // 2. Create metadata for HCS
  const answerId = `a-${Date.now()}-${accountId.split(".")[2]}`;
  const hcsMetadata = {
    type: "answer",
    answerId,
    questionId,
    author: accountId,
    isAI,
    confidence,
    cid,
    timestamp: Date.now(),
  };

  // 3. Submit to HCS
  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.ANSWERS,
    hcsMetadata,
  );

  return {
    answerId,
    transactionId: transactionId.toString(),
    cid,
    status: status,
  };
}

/**
 * Submit Update/News
 * @param {object} updateData - { title, content, tags }
 * @param {object} dAppConnector - DAppConnector instance
 * @param {string} accountId - User's account ID
 * @returns {Promise<object>} - { updateId, transactionId, cid }
 */
export async function submitUpdate(updateData, dAppConnector, accountId) {
  const { title, content, tags, url } = updateData;

  // 1. Upload full content to Pinata
  const contentForPinata = {
    content,
  };

  const pinataUrl = await uploadJsonToPinata(contentForPinata);
  const cid = pinataUrl.split("/ipfs/")[1];

  // 2. Create metadata for HCS
  const updateId = `u-${Date.now()}-${accountId.split(".")[2]}`;
  const hcsMetadata = {
    type: "update",
    updateId,
    title,
    author: accountId,
    tags: tags || [],
    url: url || null,
    cid,
    timestamp: Date.now(),
  };

  // 3. Submit to HCS
  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.UPDATES,
    hcsMetadata,
  );

  return {
    updateId,
    transactionId: transactionId.toString(),
    cid,
    status: status,
  };
}

/**
 * Submit Answer Acceptance
 * @param {object} acceptanceData - { questionId, answerId }
 * @param {object} dAppConnector - DAppConnector instance
 * @param {string} accountId - User's account ID (must be question author)
 * @returns {Promise<object>} - { transactionId, status }
 */
export async function submitAcceptance(
  acceptanceData,
  dAppConnector,
  accountId,
) {
  const { questionId, answerId } = acceptanceData;

  // Acceptance is lightweight - goes directly to HCS
  const hcsMetadata = {
    type: "acceptance",
    questionId,
    answerId,
    acceptedBy: accountId,
    timestamp: Date.now(),
  };

  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.ACCEPTANCES,
    hcsMetadata,
  );

  return {
    transactionId: transactionId.toString(),
    status: status,
  };
}

/**
 * Submit Comment
 * @param {object} commentData - { parentId, parentType, content }
 * @param {object} dAppConnector - DAppConnector instance
 * @param {string} accountId - User's account ID
 * @returns {Promise<object>} - { commentId, transactionId, cid }
 */
export async function submitComment(commentData, dAppConnector, accountId) {
  const { parentId, parentType, content } = commentData;

  // 1. Upload content to Pinata
  const contentForPinata = { content };
  const pinataUrl = await uploadJsonToPinata(contentForPinata);
  const cid = pinataUrl.split("/ipfs/")[1];

  // 2. Create metadata for HCS
  const commentId = `c-${Date.now()}-${accountId.split(".")[2]}`;
  const hcsMetadata = {
    type: "comment",
    commentId,
    parentId, // question/answer/update ID
    parentType, // 'question', 'answer', 'update'
    author: accountId,
    cid,
    timestamp: Date.now(),
  };

  // 3. Submit to HCS
  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.COMMENTS,
    hcsMetadata,
  );

  return {
    commentId,
    transactionId: transactionId.toString(),
    cid,
    status: status,
  };
}

/**
 * Update topic IDs (call this on app init with your actual topic IDs)
 * @param {object} topicIds - { QUESTIONS, ANSWERS, UPDATES, ACCEPTANCES, COMMENTS }
 */
export function setTopicIds(topicIds) {
  Object.assign(TOPICS, topicIds);
}

export { TOPICS };

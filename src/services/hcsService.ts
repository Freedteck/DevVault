import { submitMessage } from "./createMessage.ts";
import { uploadJsonToPinata } from "./pinata.ts";
import { TOPICS } from "./constants.ts";
import { depositBountyToEscrow, releaseEscrow } from "./escrowService.ts";
import type {
  QuestionMetadata,
  AnswerMetadata,
  UpdateMetadata,
  AcceptanceMetadata,
  CommentMetadata,
  TopicIds,
} from "../types/index.ts";

export { releaseEscrow };

/**
 * HCS Service - Handles submission of different content types
 * Splits large content (Pinata) from metadata (HCS)
 */

interface QuestionSubmissionResult {
  questionId: string;
  transactionId: string;
  cid: string;
  status: string;
  escrowTxId?: string;
  escrowError?: string;
}

/**
 * Submit Question
 * @param questionData - { title, description, codeSnippet, tags, bounty }
 * @param dAppConnector - DAppConnector instance
 * @param accountId - User's account ID
 * @returns - { questionId, transactionId, cid, escrowTxId? }
 */
export async function submitQuestion(
  questionData: {
    title: string;
    description: string;
    codeSnippet?: string;
    tags?: string[];
    bounty?: number;
  },
  dAppConnector: any,
  accountId: string,
): Promise<QuestionSubmissionResult> {
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
  const hcsMetadata: QuestionMetadata = {
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
    TOPICS.QUESTIONS!,
    hcsMetadata,
  );

  const result: QuestionSubmissionResult = {
    questionId,
    transactionId: transactionId.toString(),
    cid,
    status: status,
  };

  // 4. If bounty > 0, deposit to escrow contract
  if (bounty && bounty > 0) {
    try {
      const escrowContractId = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID;
      if (!escrowContractId) {
        console.warn(
          "⚠️ NEXT_PUBLIC_ESCROW_CONTRACT_ID not set, skipping escrow deposit",
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
    } catch (escrowError: any) {
      console.error("❌ Escrow deposit failed:", escrowError);
      // Don't fail the whole question submission if escrow fails
      result.escrowError = escrowError.message;
    }
  }

  return result;
}

/**
 * Submit Answer
 * @param answerData - { questionId, content, isAI, confidence }
 * @param dAppConnector - DAppConnector instance
 * @param accountId - User's account ID
 * @returns - { answerId, transactionId, cid }
 */
export async function submitAnswer(
  answerData: {
    questionId: string;
    content: string;
    isAI?: boolean;
    confidence?: number | null;
  },
  dAppConnector: any,
  accountId: string,
): Promise<{
  answerId: string;
  transactionId: string;
  cid: string;
  status: string;
}> {
  const { questionId, content, isAI = false, confidence = null } = answerData;

  // 1. Upload full content to Pinata
  const contentForPinata = {
    content,
  };

  const pinataUrl = await uploadJsonToPinata(contentForPinata);
  const cid = pinataUrl.split("/ipfs/")[1];

  // 2. Create metadata for HCS
  const answerId = `a-${Date.now()}-${accountId.split(".")[2]}`;
  const hcsMetadata: AnswerMetadata = {
    answerId,
    questionId,
    author: accountId,
    isAI,
    confidence: confidence === null ? undefined : confidence,
    cid,
    timestamp: Date.now(),
  };

  // 3. Submit to HCS
  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.ANSWERS!,
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
 * @param updateData - { title, content, tags, url }
 * @param dAppConnector - DAppConnector instance
 * @param accountId - User's account ID
 * @returns - { updateId, transactionId, cid }
 */
export async function submitUpdate(
  updateData: {
    title: string;
    content: string;
    tags?: string[];
    url?: string;
  },
  dAppConnector: any,
  accountId: string,
): Promise<{
  updateId: string;
  transactionId: string;
  cid: string;
  status: string;
}> {
  const { title, content, tags, url } = updateData;

  // 1. Upload full content to Pinata
  const contentForPinata = {
    content,
  };

  const pinataUrl = await uploadJsonToPinata(contentForPinata);
  const cid = pinataUrl.split("/ipfs/")[1];

  // 2. Create metadata for HCS
  const updateId = `u-${Date.now()}-${accountId.split(".")[2]}`;
  const hcsMetadata: UpdateMetadata = {
    updateId,
    title,
    author: accountId,
    tags: tags || [],
    url: url || null || undefined,
    cid,
    timestamp: Date.now(),
  };

  // 3. Submit to HCS
  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.UPDATES!,
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
 * @param acceptanceData - { questionId, answerId }
 * @param dAppConnector - DAppConnector instance
 * @param accountId - User's account ID (must be question author)
 * @returns - { transactionId, status }
 */
export async function submitAcceptance(
  acceptanceData: {
    questionId: string;
    answerId: string;
  },
  dAppConnector: any,
  accountId: string,
): Promise<{
  transactionId: string;
  status: string;
}> {
  const { questionId, answerId } = acceptanceData;

  // Acceptance is lightweight - goes directly to HCS
  const hcsMetadata: AcceptanceMetadata = {
    questionId,
    answerId,
    acceptedBy: accountId,
    timestamp: Date.now(),
  };

  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.ACCEPTANCES!,
    hcsMetadata,
  );

  return {
    transactionId: transactionId.toString(),
    status: status,
  };
}

/**
 * Submit Comment
 * @param commentData - { parentId, parentType, content }
 * @param dAppConnector - DAppConnector instance
 * @param accountId - User's account ID
 * @returns - { commentId, transactionId, cid }
 */
export async function submitComment(
  commentData: {
    parentId: string;
    parentType: "question" | "answer" | "update";
    content: string;
  },
  dAppConnector: any,
  accountId: string,
): Promise<{
  commentId: string;
  transactionId: string;
  cid: string;
  status: string;
}> {
  const { parentId, parentType: _parentType, content } = commentData;

  // 1. Upload content to Pinata
  const contentForPinata = { content };
  const pinataUrl = await uploadJsonToPinata(contentForPinata);
  const cid = pinataUrl.split("/ipfs/")[1];

  // 2. Create metadata for HCS
  const commentId = `c-${Date.now()}-${accountId.split(".")[2]}`;
  const hcsMetadata: CommentMetadata = {
    commentId,
    parentId, // question/answer/update ID
    author: accountId,
    cid,
    timestamp: Date.now(),
  };

  // 3. Submit to HCS
  const [status, transactionId] = await submitMessage(
    dAppConnector,
    accountId,
    TOPICS.COMMENTS!,
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
 * @param topicIds - { QUESTIONS, ANSWERS, UPDATES, ACCEPTANCES, COMMENTS }
 */
export function setTopicIds(topicIds: Partial<TopicIds>): void {
  Object.assign(TOPICS, topicIds);
}

export { TOPICS };

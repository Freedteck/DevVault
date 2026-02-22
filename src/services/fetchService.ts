import { fetchWithRetry } from "../utils/fetchUtils";
import {
  getMessagesWithPagination,
  getMessageBySequenceNumber,
} from "./getMessages.ts";
import { TOPICS } from "./constants.ts";
// ... existing imports ...
import type {
  HCSMessage,
  Question,
  Answer,
  Update,
  Comment,
  QuestionsResponse,
  UpdatesResponse,
  RankMap,
  AcceptanceMetadata,
  AnswerMetadata,
  AuthorScore,
  UserRank,
} from "../types/index.ts";

/**
 * Fetch Service - Retrieves and parses content from HCS + Pinata
 */

/**
 * Build a map of accountId → rank label from all answer + acceptance messages.
 * Mirrors the same thresholds used in useLeaderboard and useUserProfile.
 */
function computeAuthorRankMap(
  answerMessages: HCSMessage[],
  acceptanceMessages: HCSMessage[],
): RankMap {
  // Map answerId → author account
  const answerAuthors: Record<string, string> = {};
  answerMessages.forEach((msg) => {
    const answer = JSON.parse(msg.content);
    if (answer.answerId && answer.author) {
      answerAuthors[answer.answerId] = answer.author;
    }
  });

  // Count unique accepted answers per author
  const authorScores: AuthorScore = {};
  const seen = new Set<string>();
  acceptanceMessages.forEach((msg) => {
    const acceptance = JSON.parse(msg.content) as AcceptanceMetadata;
    const author = answerAuthors[acceptance.answerId];
    if (!author) return;
    const key = `${author}:${acceptance.answerId}`;
    if (seen.has(key)) return;
    seen.add(key);
    authorScores[author] = (authorScores[author] || 0) + 100;
  });

  // Convert scores → rank labels
  const rankMap: RankMap = {};
  Object.entries(authorScores).forEach(([author, score]) => {
    if (score >= 1000) rankMap[author] = "Legend";
    else if (score >= 500) rankMap[author] = "Expert";
    else if (score >= 200) rankMap[author] = "Contributor";
    else rankMap[author] = "Helper";
  });
  return rankMap;
}

/** Look up an author's rank, defaulting to "Helper". */
function getAuthorRank(accountId: string, rankMap: RankMap): string {
  return rankMap[accountId] || "Helper";
}

/**
 * Fetch content from Pinata using CID
 */
async function fetchFromPinata(
  cid: string,
  gateway: string,
): Promise<Record<string, any>> {
  const url = `https://${gateway}/ipfs/${cid}`;
  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from Pinata: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch questions with full content
 */
export async function fetchQuestions(
  limit: number = 10,
  nextLink: string | null = null,
  gateway: string,
): Promise<QuestionsResponse> {
  // 1. Get metadata from HCS
  const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
    TOPICS.QUESTIONS!,
    limit,
    nextLink,
  );

  // 2. Fetch all answers to get counts
  const { messages: answerMessages } = await getMessagesWithPagination(
    TOPICS.ANSWERS!,
    1000, // Get all answers
    null,
  );
  const answersByQuestion: Record<string, AnswerMetadata[]> = {};
  answerMessages.forEach((msg) => {
    const answer = JSON.parse(msg.content) as AnswerMetadata;
    if (!answersByQuestion[answer.questionId]) {
      answersByQuestion[answer.questionId] = [];
    }
    answersByQuestion[answer.questionId].push(answer);
  });

  // 3. Fetch all acceptances to check solved status
  const { messages: acceptanceMessages } = await getMessagesWithPagination(
    TOPICS.ACCEPTANCES!,
    1000, // Get all acceptances
    null,
  );
  const acceptedQuestions = new Set<string>();
  acceptanceMessages.forEach((msg) => {
    const acceptance = JSON.parse(msg.content) as AcceptanceMetadata;
    acceptedQuestions.add(acceptance.questionId);
  });

  // Build author rank map from all answers + acceptances (zero extra HCS calls)
  const authorRankMap = computeAuthorRankMap(
    answerMessages,
    acceptanceMessages,
  );

  // 2. Parse and fetch full content from Pinata
  const questions = await Promise.all(
    messages.map(async (msg) => {
      const metadata = JSON.parse(msg.content) as any;

      // Fetch full content from Pinata
      const fullContent = await fetchFromPinata(metadata.cid, gateway);

      return {
        sequenceNumber: msg.sequenceNumber,
        questionId: metadata.questionId,
        id: metadata.questionId, // For compatibility with card component
        title: metadata.title,
        description: fullContent.description,
        codeSnippet: fullContent.codeSnippet,
        tags: metadata.tags,
        bounty: metadata.bounty,
        author: {
          username: metadata.author,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${metadata.author}`,
          rank: getAuthorRank(metadata.author, authorRankMap) as UserRank,
        },
        stats: {
          answers: answersByQuestion[metadata.questionId]?.length || 0,
        },
        isSolved: acceptedQuestions.has(metadata.questionId),
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
      } as Question;
    }),
  );

  return {
    questions,
    nextLink: newNextLink,
    hasMore: !!newNextLink,
  };
}

/**
 * Fetch single question by sequence number
 */
export async function fetchQuestionBySequenceNumber(
  sequenceNumber: number,
  gateway: string,
): Promise<Question> {
  const { getMessageBySequenceNumber } = await import("./getMessages.ts");

  // 1. Fetch the question message + all answer/acceptance metadata in parallel
  const [msg, { messages: allAnswerMsgs }, { messages: allAcceptanceMsgs }] =
    await Promise.all([
      getMessageBySequenceNumber(TOPICS.QUESTIONS!, sequenceNumber),
      getMessagesWithPagination(TOPICS.ANSWERS!, 1000, null),
      getMessagesWithPagination(TOPICS.ACCEPTANCES!, 1000, null),
    ]);
  const metadata = JSON.parse(msg.content) as any;

  // 2. Fetch full content from Pinata
  const fullContent = await fetchFromPinata(metadata.cid, gateway);

  // 3. Build rank map for the question author
  const authorRankMap = computeAuthorRankMap(allAnswerMsgs, allAcceptanceMsgs);

  // 4. Derive solved status
  const acceptedQIds = new Set(
    allAcceptanceMsgs.map((m) => JSON.parse(m.content).questionId),
  );

  return {
    sequenceNumber: msg.sequenceNumber,
    questionId: metadata.questionId,
    id: metadata.questionId,
    title: metadata.title,
    description: fullContent.description,
    codeSnippet: fullContent.codeSnippet,
    tags: metadata.tags,
    bounty: metadata.bounty,
    author: {
      username: metadata.author,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${metadata.author}`,
      rank: getAuthorRank(metadata.author, authorRankMap) as UserRank,
    },
    stats: {
      views: 0,
      answers: 0,
      likes: 0,
    },
    isSolved: acceptedQIds.has(metadata.questionId),
    cid: metadata.cid,
    timestamp: metadata.timestamp,
    createdAt: new Date(metadata.timestamp).toISOString(),
  };
}

/**
 * Fetch answers for a specific question
 */
export async function fetchAnswersForQuestion(
  questionId: string,
  gateway: string,
): Promise<Answer[]> {
  // 1. Get all answers from HCS (we'll filter client-side for now)
  let allAnswers: AnswerMetadata[] = [];
  let nextLink: string | null = null;
  const allAnswerMessages: HCSMessage[] = []; // all raw HCS messages for rank-map building

  do {
    const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
      TOPICS.ANSWERS!,
      100, // Get in batches
      nextLink,
    );

    allAnswerMessages.push(...messages);
    const parsed = messages.map(
      (msg) => JSON.parse(msg.content) as AnswerMetadata,
    );
    allAnswers.push(...parsed.filter((a) => a.questionId === questionId));

    nextLink = newNextLink;
  } while (nextLink); // Keep fetching until no more pages

  // 2. Fetch acceptances to check which answer is accepted
  const { messages: acceptanceMessages } = await getMessagesWithPagination(
    TOPICS.ACCEPTANCES!,
    1000,
    null,
  );
  const acceptedAnswerIds = new Set<string>();
  acceptanceMessages.forEach((msg) => {
    const acceptance = JSON.parse(msg.content) as AcceptanceMetadata;
    if (acceptance.questionId === questionId) {
      acceptedAnswerIds.add(acceptance.answerId);
    }
  });

  // Build author rank map from ALL answers + ALL acceptances
  const authorRankMap = computeAuthorRankMap(
    allAnswerMessages,
    acceptanceMessages,
  );

  // 3. Fetch full content from Pinata for each answer
  const answers = await Promise.all(
    allAnswers.map(async (metadata) => {
      const fullContent = await fetchFromPinata(metadata.cid, gateway);

      return {
        answerId: metadata.answerId,
        questionId: metadata.questionId,
        content: fullContent.content,
        author: {
          username: metadata.author as string,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${metadata.author}`,
          rank: getAuthorRank(
            metadata.author as string,
            authorRankMap,
          ) as UserRank,
        },
        isAI: metadata.isAI || false,
        confidence: metadata.confidence,
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
        isAccepted: acceptedAnswerIds.has(metadata.answerId),
      } as Answer;
    }),
  );

  return answers;
}

/**
 * Fetch acceptances for questions
 */
export async function fetchAcceptances(): Promise<AcceptanceMetadata[]> {
  let allAcceptances: AcceptanceMetadata[] = [];
  let nextLink: string | null = null;

  do {
    const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
      TOPICS.ACCEPTANCES!,
      100,
      nextLink,
    );

    const parsed = messages.map(
      (msg) => JSON.parse(msg.content) as AcceptanceMetadata,
    );
    allAcceptances.push(...parsed);

    nextLink = newNextLink;
  } while (nextLink);

  return allAcceptances;
}

/**
 * Fetch updates/news with full content
 */
export async function fetchUpdates(
  limit: number = 10,
  nextLink: string | null = null,
  gateway: string,
): Promise<UpdatesResponse> {
  const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
    TOPICS.UPDATES!,
    limit,
    nextLink,
  );

  const updates = await Promise.all(
    messages.map(async (msg) => {
      const metadata = JSON.parse(msg.content) as any;
      const fullContent = await fetchFromPinata(metadata.cid, gateway);

      return {
        sequenceNumber: msg.sequenceNumber,
        updateId: metadata.updateId,
        title: metadata.title,
        content: fullContent.content,
        tags: metadata.tags,
        url: metadata.url || null,
        author: metadata.author,
        timestamp: metadata.timestamp,
        image: "/update-banner.png",
        createdAt: new Date(metadata.timestamp).toISOString(),
      } as Update;
    }),
  );

  return {
    updates,
    nextLink: newNextLink,
    hasMore: !!newNextLink,
  };
}

/**
 * Fetch single update by sequence number
 */
export async function fetchUpdateBySequenceNumber(
  sequenceNumber: number,
  gateway: string,
): Promise<Update> {
  const msg = await getMessageBySequenceNumber(TOPICS.UPDATES!, sequenceNumber);
  const metadata = JSON.parse(msg.content) as any;

  const fullContent = await fetchFromPinata(metadata.cid, gateway);

  return {
    sequenceNumber: msg.sequenceNumber,
    updateId: metadata.updateId,
    title: metadata.title,
    content: fullContent.content,
    tags: metadata.tags,
    url: metadata.url || null,
    author: metadata.author,
    timestamp: metadata.timestamp,
    image: "/update-banner.png",
    createdAt: new Date(metadata.timestamp).toISOString(),
  } as Update;
}

/**
 * Fetch comments for a parent (question/answer/update)
 */
export async function fetchComments(
  parentId: string,
  gateway: string,
): Promise<Comment[]> {
  // 1. Get all comments from HCS (filter client-side)
  let allComments: Array<any> = [];
  let nextLink: string | null = null;

  do {
    const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
      TOPICS.COMMENTS!,
      100,
      nextLink,
    );

    const parsed = messages.map((msg) => JSON.parse(msg.content));
    allComments.push(...parsed.filter((c) => c.parentId === parentId));

    nextLink = newNextLink;
  } while (nextLink);

  // 2. Fetch full content from Pinata for each comment
  const comments = await Promise.all(
    allComments.map(async (metadata) => {
      const fullContent = await fetchFromPinata(metadata.cid, gateway);

      return {
        id: metadata.commentId,
        content: fullContent.content,
        author: {
          username: metadata.author,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${metadata.author}`,
        },
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
      } as Comment;
    }),
  );

  return comments;
}

/**
 * Update topic IDs (call this on app init)
 */
export function setTopicIds(topicIds: Partial<typeof TOPICS>): void {
  Object.assign(TOPICS, topicIds);
}

export { TOPICS };

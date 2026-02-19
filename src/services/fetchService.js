import { getMessagesWithPagination } from "./getMessages.js";
import { TOPICS } from "./constants.js";

/**
 * Fetch Service - Retrieves and parses content from HCS + Pinata
 */

/**
 * Build a map of accountId → rank label from all answer + acceptance messages.
 * Mirrors the same thresholds used in useLeaderboard and useUserProfile.
 * @param {Array} answerMessages - Raw HCS messages from TOPICS.ANSWERS
 * @param {Array} acceptanceMessages - Raw HCS messages from TOPICS.ACCEPTANCES
 * @returns {Object} { [accountId]: "Helper"|"Contributor"|"Expert"|"Legend" }
 */
function computeAuthorRankMap(answerMessages, acceptanceMessages) {
  // Map answerId → author account
  const answerAuthors = {};
  answerMessages.forEach((msg) => {
    const answer = JSON.parse(msg.content);
    if (answer.answerId && answer.author) {
      answerAuthors[answer.answerId] = answer.author;
    }
  });

  // Count unique accepted answers per author
  const authorScores = {};
  const seen = new Set();
  acceptanceMessages.forEach((msg) => {
    const acceptance = JSON.parse(msg.content);
    const author = answerAuthors[acceptance.answerId];
    if (!author) return;
    const key = `${author}:${acceptance.answerId}`;
    if (seen.has(key)) return;
    seen.add(key);
    authorScores[author] = (authorScores[author] || 0) + 100;
  });

  // Convert scores → rank labels
  const rankMap = {};
  Object.entries(authorScores).forEach(([author, score]) => {
    if (score >= 1000) rankMap[author] = "Legend";
    else if (score >= 500) rankMap[author] = "Expert";
    else if (score >= 200) rankMap[author] = "Contributor";
    else rankMap[author] = "Helper";
  });
  return rankMap;
}

/** Look up an author's rank, defaulting to "Helper". */
function getAuthorRank(accountId, rankMap) {
  return rankMap[accountId] || "Helper";
}

/**
 * Fetch content from Pinata using CID
 * @param {string} cid - IPFS CID
 * @param {string} gateway - Pinata gateway URL
 * @returns {Promise<object>} - Content from Pinata
 */
async function fetchFromPinata(cid, gateway) {
  const url = `https://${gateway}/ipfs/${cid}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from Pinata: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch questions with full content
 * @param {number} limit - Number of questions per page
 * @param {string} nextLink - Next page link
 * @param {string} gateway - Pinata gateway URL
 * @returns {Promise<object>} - { questions, nextLink, hasMore }
 */
export async function fetchQuestions(limit = 10, nextLink = null, gateway) {
  // 1. Get metadata from HCS
  const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
    TOPICS.QUESTIONS,
    limit,
    nextLink,
  );

  // 2. Fetch all answers to get counts
  const { messages: answerMessages } = await getMessagesWithPagination(
    TOPICS.ANSWERS,
    1000, // Get all answers
    null,
  );
  const answersByQuestion = {};
  answerMessages.forEach((msg) => {
    const answer = JSON.parse(msg.content);
    if (!answersByQuestion[answer.questionId]) {
      answersByQuestion[answer.questionId] = [];
    }
    answersByQuestion[answer.questionId].push(answer);
  });

  // 3. Fetch all acceptances to check solved status
  const { messages: acceptanceMessages } = await getMessagesWithPagination(
    TOPICS.ACCEPTANCES,
    1000, // Get all acceptances
    null,
  );
  const acceptedQuestions = new Set();
  acceptanceMessages.forEach((msg) => {
    const acceptance = JSON.parse(msg.content);
    acceptedQuestions.add(acceptance.questionId);
  });

  // Build author rank map from all answers + acceptances (zero extra HCS calls)
  const authorRankMap = computeAuthorRankMap(answerMessages, acceptanceMessages);

  // 2. Parse and fetch full content from Pinata
  const questions = await Promise.all(
    messages.map(async (msg) => {
      const metadata = JSON.parse(msg.content);

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
          rank: getAuthorRank(metadata.author, authorRankMap),
        },
        stats: {
          answers: answersByQuestion[metadata.questionId]?.length || 0,
        },
        isSolved: acceptedQuestions.has(metadata.questionId),
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
      };
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
 * @param {number} sequenceNumber - Sequence number of question
 * @param {string} gateway - Pinata gateway URL
 * @returns {Promise<object>} - Question data
 */
export async function fetchQuestionBySequenceNumber(sequenceNumber, gateway) {
  const { getMessageBySequenceNumber } = await import("./getMessages.js");

  // 1. Fetch the question message + all answer/acceptance metadata in parallel
  const [msg, { messages: allAnswerMsgs }, { messages: allAcceptanceMsgs }] =
    await Promise.all([
      getMessageBySequenceNumber(TOPICS.QUESTIONS, sequenceNumber),
      getMessagesWithPagination(TOPICS.ANSWERS, 1000, null),
      getMessagesWithPagination(TOPICS.ACCEPTANCES, 1000, null),
    ]);
  const metadata = JSON.parse(msg.content);

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
    title: metadata.title,
    description: fullContent.description,
    codeSnippet: fullContent.codeSnippet,
    tags: metadata.tags,
    bounty: metadata.bounty,
    author: {
      username: metadata.author,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${metadata.author}`,
      rank: getAuthorRank(metadata.author, authorRankMap),
    },
    stats: {
      views: 0,
      answers: 0,
      likes: 0,
    },
    isSolved: acceptedQIds.has(metadata.questionId),
    timestamp: metadata.timestamp,
    createdAt: new Date(metadata.timestamp).toISOString(),
  };
}

/**
 * Fetch answers for a specific question
 * @param {string} questionId - Question ID
 * @param {string} gateway - Pinata gateway URL
 * @returns {Promise<Array>} - Array of answers
 */
export async function fetchAnswersForQuestion(questionId, gateway) {
  // 1. Get all answers from HCS (we'll filter client-side for now)
  let allAnswers = [];
  let nextLink = null;
  const allAnswerMessages = []; // all raw HCS messages for rank-map building

  do {
    const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
      TOPICS.ANSWERS,
      100, // Get in batches
      nextLink,
    );

    allAnswerMessages.push(...messages);
    const parsed = messages.map((msg) => JSON.parse(msg.content));
    allAnswers.push(...parsed.filter((a) => a.questionId === questionId));

    nextLink = newNextLink;
  } while (nextLink); // Keep fetching until no more pages

  // 2. Fetch acceptances to check which answer is accepted
  const { messages: acceptanceMessages } = await getMessagesWithPagination(
    TOPICS.ACCEPTANCES,
    1000,
    null,
  );
  const acceptedAnswerIds = new Set();
  acceptanceMessages.forEach((msg) => {
    const acceptance = JSON.parse(msg.content);
    if (acceptance.questionId === questionId) {
      acceptedAnswerIds.add(acceptance.answerId);
    }
  });

  // Build author rank map from ALL answers + ALL acceptances
  const authorRankMap = computeAuthorRankMap(allAnswerMessages, acceptanceMessages);

  // 3. Fetch full content from Pinata for each answer
  const answers = await Promise.all(
    allAnswers.map(async (metadata) => {
      const fullContent = await fetchFromPinata(metadata.cid, gateway);

      return {
        answerId: metadata.answerId,
        questionId: metadata.questionId,
        content: fullContent.content,
        author: {
          username: metadata.author,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${metadata.author}`,
          rank: getAuthorRank(metadata.author, authorRankMap),
        },
        isAI: metadata.isAI || false,
        confidence: metadata.confidence,
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
        isAccepted: acceptedAnswerIds.has(metadata.answerId),
      };
    }),
  );

  return answers;
}

/**
 * Fetch acceptances for questions
 * @returns {Promise<Array>} - Array of acceptances
 */
export async function fetchAcceptances() {
  let allAcceptances = [];
  let nextLink = null;

  do {
    const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
      TOPICS.ACCEPTANCES,
      100,
      nextLink,
    );

    const parsed = messages.map((msg) => JSON.parse(msg.content));
    allAcceptances.push(...parsed);

    nextLink = newNextLink;
  } while (nextLink);

  return allAcceptances;
}

/**
 * Fetch updates/news with full content
 * @param {number} limit - Number of updates per page
 * @param {string} nextLink - Next page link
 * @param {string} gateway - Pinata gateway URL
 * @returns {Promise<object>} - { updates, nextLink }
 */
export async function fetchUpdates(limit = 10, nextLink = null, gateway) {
  const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
    TOPICS.UPDATES,
    limit,
    nextLink,
  );

  const updates = await Promise.all(
    messages.map(async (msg) => {
      const metadata = JSON.parse(msg.content);
      const fullContent = await fetchFromPinata(metadata.cid, gateway);

      return {
        updateId: metadata.updateId,
        title: metadata.title,
        content: fullContent.content,
        tags: metadata.tags,
        url: metadata.url || null,
        author: metadata.author,
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
      };
    }),
  );

  return {
    updates,
    nextLink: newNextLink,
    hasMore: !!newNextLink,
  };
}

/**
 * Fetch comments for a parent (question/answer/update)
 * @param {string} parentId - ID of parent (question/answer/update)
 * @param {string} gateway - Pinata gateway URL
 * @returns {Promise<Array>} - Array of comments
 */
export async function fetchComments(parentId, gateway) {
  // 1. Get all comments from HCS (filter client-side)
  let allComments = [];
  let nextLink = null;

  do {
    const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
      TOPICS.COMMENTS,
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
      };
    }),
  );

  return comments;
}

/**
 * Calculate reputation for an account
 * @param {string} accountId - Account to calculate reputation for
 * @returns {Promise<object>} - { acceptanceCount, tier, score }
 */
export async function calculateReputation(accountId) {
  const acceptances = await fetchAcceptances();

  // Count acceptances where this account's answer was accepted
  const userAcceptances = acceptances.filter((acc) => {
    // We need to match answerId to this user's answers
    // This requires fetching answers to check authors
    // For now, simplified version
    return acc.answerId && acc.answerId.includes(accountId.split(".")[2]);
  });

  const acceptanceCount = userAcceptances.length;

  // Determine tier
  let tier = "Helper";
  if (acceptanceCount >= 10) tier = "Legend";
  else if (acceptanceCount >= 5) tier = "Expert";
  else if (acceptanceCount >= 3) tier = "Contributor";

  return {
    acceptanceCount,
    tier,
    score: acceptanceCount * 15, // 15 points per acceptance (like Stack Overflow)
  };
}

/**
 * Update topic IDs (call this on app init)
 * @param {object} topicIds - { QUESTIONS, ANSWERS, UPDATES, ACCEPTANCES, COMMENTS }
 */
export function setTopicIds(topicIds) {
  Object.assign(TOPICS, topicIds);
}

export { TOPICS };

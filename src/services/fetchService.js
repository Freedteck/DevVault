import { getMessagesWithPagination } from "./getMessages.js";
import { TOPICS } from "./constants.js";

/**
 * Fetch Service - Retrieves and parses content from HCS + Pinata
 */

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
 * @returns {Promise<object>} - { questions, nextLink }
 */
export async function fetchQuestions(limit = 10, nextLink = null, gateway) {
  // 1. Get metadata from HCS
  const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
    TOPICS.QUESTIONS,
    limit,
    nextLink,
  );

  // 2. Parse and fetch full content from Pinata
  const questions = await Promise.all(
    messages.map(async (msg) => {
      const metadata = JSON.parse(msg.content);

      // Fetch full content from Pinata
      const fullContent = await fetchFromPinata(metadata.cid, gateway);

      return {
        questionId: metadata.questionId,
        title: metadata.title,
        description: fullContent.description,
        codeSnippet: fullContent.codeSnippet,
        tags: metadata.tags,
        bounty: metadata.bounty,
        author: metadata.author,
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
      };
    }),
  );

  return {
    questions,
    nextLink: newNextLink,
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

  do {
    const { messages, nextLink: newNextLink } = await getMessagesWithPagination(
      TOPICS.ANSWERS,
      100, // Get in batches
      nextLink,
    );

    const parsed = messages.map((msg) => JSON.parse(msg.content));
    allAnswers.push(...parsed.filter((a) => a.questionId === questionId));

    nextLink = newNextLink;
  } while (nextLink); // Keep fetching until no more pages

  // 2. Fetch full content from Pinata for each answer
  const answers = await Promise.all(
    allAnswers.map(async (metadata) => {
      const fullContent = await fetchFromPinata(metadata.cid, gateway);

      return {
        answerId: metadata.answerId,
        questionId: metadata.questionId,
        content: fullContent.content,
        author: metadata.author,
        isAI: metadata.isAI || false,
        confidence: metadata.confidence,
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
        likes: 0, // TODO: Calculate from separate likes topic if you add that
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
        author: metadata.author,
        timestamp: metadata.timestamp,
        createdAt: new Date(metadata.timestamp).toISOString(),
      };
    }),
  );

  return {
    updates,
    nextLink: newNextLink,
  };
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

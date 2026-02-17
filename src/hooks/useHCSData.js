import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for fetching and managing Hedera HCS (Hashgraph Consensus Service) data
 * @param {string} topicId - The HCS topic ID to fetch from
 * @param {Object} options - Configuration options
 * @param {function} options.filter - Filter function for messages
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: true)
 * @param {number} options.limit - Number of items per page (default: 10)
 * @param {Array} options.dependencies - Additional dependencies for refetching
 */
export const useHCSData = (topicId, options = {}) => {
  const {
    filter = () => true,
    autoFetch = true,
    limit = 10,
    dependencies = [],
  } = options;

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextLink, setNextLink] = useState(null);

  const fetchData = useCallback(
    async (isLoadMore = false) => {
      if (!topicId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const url =
          isLoadMore && nextLink
            ? `https://testnet.mirrornode.hedera.com${nextLink}`
            : `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?order=desc&limit=${limit}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const responseData = await response.json();

        const messages = (responseData.messages || [])
          .map((message) => {
            try {
              const decodedMessage = atob(message.message);
              const parsedData = JSON.parse(decodedMessage);
              // Include sequence_number and consensus_timestamp as unique identifiers
              return {
                ...parsedData,
                sequence_number: message.sequence_number,
                consensus_timestamp: message.consensus_timestamp,
              };
            } catch {
              return null;
            }
          })
          .filter((msg) => msg !== null)
          .filter(filter);

        setData((prev) => (isLoadMore ? [...prev, ...messages] : messages));
        setNextLink(responseData.links?.next || null);
        setHasMore(!!responseData.links?.next);
      } catch (err) {
        console.error("Failed to fetch HCS data:", err);
        setError(err.message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [topicId, filter, limit, nextLink]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, ...dependencies]);

  const refetch = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      return fetchData(true);
    }
  }, [fetchData, hasMore, isLoading]);

  return {
    data,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
};

/**
 * Hook for fetching questions
 */
export const useQuestions = () => {
  const topicId = import.meta.env.VITE_QUESTIONS_TOPIC_ID;

  return useHCSData(topicId, {
    limit: 10,
  });
};

/**
 * Hook for fetching updates
 */
export const useUpdates = () => {
  const topicId = import.meta.env.VITE_UPDATES_TOPIC_ID;

  return useHCSData(topicId, {
    limit: 10,
  });
};
/**
 * Hook for fetching answers for a specific question
 */
export const useAnswers = (questionId) => {
  const answersTopicId = import.meta.env.VITE_ANSWERS_TOPIC_ID;

  return useHCSData(answersTopicId, {
    filter: (msg) =>
      msg.commentsId && String(msg.commentsId) === String(questionId),
    dependencies: [questionId],
  });
};

/**
 * Hook for fetching comments for a specific update
 */
export const useUpdateComments = (updateId) => {
  const commentsTopicId = import.meta.env.VITE_COMMENTS_TOPIC_ID;

  return useHCSData(commentsTopicId, {
    filter: (msg) => {
      // Convert both to strings for comparison
      return msg.commentsId && String(msg.commentsId) === String(updateId);
    },
    dependencies: [updateId],
  });
};

/**
 * Hook for fetching acceptances for a specific question
 */
export const useAcceptances = (questionId) => {
  const acceptancesTopicId = import.meta.env.VITE_ACCEPTANCES_TOPIC_ID;

  return useHCSData(acceptancesTopicId, {
    filter: (msg) => {
      // Convert both to strings for comparison
      return (
        msg.type === "acceptance" &&
        String(msg.questionId) === String(questionId)
      );
    },
    dependencies: [questionId],
  });
};

/**
 * Hook for fetching user's accepted answers count
 */
export const useUserAcceptanceCount = (accountId) => {
  const acceptancesTopicId = import.meta.env.VITE_ACCEPTANCES_TOPIC_ID;

  const result = useHCSData(acceptancesTopicId, {
    filter: (msg) => {
      return msg.type === "acceptance" && msg.answerAuthor === accountId;
    },
    dependencies: [accountId],
    autoFetch: !!accountId,
  });

  return {
    ...result,
    count: result.data.length,
  };
};

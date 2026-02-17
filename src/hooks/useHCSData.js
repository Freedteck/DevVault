import { useState, useEffect, useCallback } from "react";

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

        const rawMessages = responseData.messages || [];

        // Group messages by transaction ID and reassemble chunks
        const messageGroups = {};
        rawMessages.forEach((message) => {
          const txId =
            message.chunk_info.initial_transaction_id.transaction_valid_start;
          if (!messageGroups[txId]) {
            messageGroups[txId] = [];
          }
          messageGroups[txId].push(message);
        });

        // Sort chunks and reassemble complete messages
        const reassembledMessages = Object.values(messageGroups).map(
          (chunks) => {
            // Sort by chunk number
            chunks.sort((a, b) => a.chunk_info.number - b.chunk_info.number);

            // Decode each chunk individually and concatenate the decoded content
            const decodedChunks = chunks.map((chunk) => {
              try {
                return atob(chunk.message.replace(/\s/g, ""));
              } catch (error) {
                console.error("Failed to decode chunk:", error);
                console.error("Chunk data:", chunk);
                return "";
              }
            });

            // Concatenate all decoded chunks
            const fullDecodedContent = decodedChunks.join("");

            // Re-encode to base64 for consistent handling
            const fullBase64 = btoa(fullDecodedContent);

            // Use metadata from the first chunk
            const firstChunk = chunks[0];

            return {
              ...firstChunk,
              message: fullBase64, // Replace with reassembled base64
            };
          }
        );

        // Parse the reassembled messages
        const messages = reassembledMessages
          .map((message) => {
            try {
              const decodedMessage = atob(message.message);

              // Skip non-JSON messages (like initialization messages)
              if (!decodedMessage.trim().startsWith("{")) {
                console.log(
                  "Skipping non-JSON message:",
                  decodedMessage.substring(0, 50) + "..."
                );
                return null;
              }

              const parsedData = JSON.parse(decodedMessage);
              // Include sequence_number and consensus_timestamp as unique identifiers
              return {
                ...parsedData,
                sequence_number: message.sequence_number,
                consensus_timestamp: message.consensus_timestamp,
              };
            } catch (error) {
              console.error("Failed to parse message:", error);
              console.error("Raw message data:", message);
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

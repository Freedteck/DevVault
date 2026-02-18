import { useState, useEffect, useCallback } from "react";
import { fetchQuestions } from "../services/fetchService";

/**
 * Hook for fetching questions with pagination and lazy loading
 */
export function useQuestions(initialLimit = 10) {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextLink, setNextLink] = useState(null);

  const gateway = import.meta.env.VITE_PINATA_GATEWAY;

  // Load questions (initial or load more)
  const loadQuestions = useCallback(
    async (isInitial = false) => {
      if (isLoading) return;
      if (!isInitial && !hasMore) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchQuestions(
          initialLimit,
          isInitial ? null : nextLink,
          gateway,
        );

        if (isInitial) {
          setQuestions(result.questions);
        } else {
          setQuestions((prev) => [...prev, ...result.questions]);
        }

        setHasMore(result.hasMore);
        setNextLink(result.nextLink);
      } catch (err) {
        console.error("Error loading questions:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMore, nextLink, initialLimit, gateway],
  );

  // Initial fetch
  useEffect(() => {
    loadQuestions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh (reload from beginning)
  const refresh = useCallback(() => {
    setQuestions([]);
    setNextLink(null);
    setHasMore(true);
    loadQuestions(true);
  }, [loadQuestions]);

  // Load more for pagination
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadQuestions(false);
    }
  }, [isLoading, hasMore, loadQuestions]);

  return {
    questions,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

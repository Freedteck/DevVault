import { useState, useEffect, useCallback } from "react";
import { fetchUpdates } from "../services/fetchService";

/**
 * Hook for fetching updates with pagination and lazy loading
 */
export function useUpdates(initialLimit = 10) {
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextLink, setNextLink] = useState(null);

  const gateway = import.meta.env.VITE_PINATA_GATEWAY;

  // Load updates (initial or load more)
  const loadUpdates = useCallback(
    async (isInitial = false) => {
      if (isLoading) return;
      if (!isInitial && !hasMore) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchUpdates(
          initialLimit,
          isInitial ? null : nextLink,
          gateway,
        );

        if (isInitial) {
          setUpdates(result.updates);
        } else {
          setUpdates((prev) => [...prev, ...result.updates]);
        }

        setHasMore(result.hasMore);
        setNextLink(result.nextLink);
      } catch (err) {
        console.error("Error loading updates:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMore, nextLink, initialLimit, gateway],
  );

  // Initial fetch
  useEffect(() => {
    loadUpdates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh (reload from beginning)
  const refresh = useCallback(() => {
    setUpdates([]);
    setNextLink(null);
    setHasMore(true);
    loadUpdates(true);
  }, [loadUpdates]);

  // Load more for pagination
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadUpdates(false);
    }
  }, [isLoading, hasMore, loadUpdates]);

  return {
    updates,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

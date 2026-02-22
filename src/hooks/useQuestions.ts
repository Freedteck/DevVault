"use client";

import { useState, useEffect, useCallback } from "react";
import { Question } from "../types";

/**
 * Hook for fetching questions with pagination and lazy loading
 */
export function useQuestions(initialLimit: number = 10, initialData?: any) {
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions || [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(
    initialData ? initialData.hasMore : true,
  );
  const [nextLink, setNextLink] = useState<string | null>(
    initialData?.nextLink || null,
  );

  // Load questions (initial or load more)
  const loadQuestions = useCallback(
    async (isInitial: boolean = false) => {
      if (isLoading) return;
      if (!isInitial && !hasMore) return;

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: initialLimit.toString(),
        });
        if (!isInitial && nextLink) {
          params.append("nextLink", nextLink);
        }

        const response = await fetch(`/api/questions?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch questions");
        const result = await response.json();

        if (isInitial) {
          setQuestions(result.questions);
        } else {
          setQuestions((prev) => [...prev, ...result.questions]);
        }

        setHasMore(result.hasMore);
        setNextLink(result.nextLink);
      } catch (err: any) {
        console.error("Error loading questions:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMore, nextLink, initialLimit],
  );

  // Initial fetch - skip if we have initialData
  useEffect(() => {
    if (!initialData) {
      loadQuestions(true);
    }
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

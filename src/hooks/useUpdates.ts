"use client";

import { useState, useEffect, useCallback } from "react";
import { Update } from "../types";

/**
 * Hook for fetching updates with pagination and lazy loading
 * Calls /api/updates instead of the service directly
 */
export function useUpdates(initialLimit: number = 10, initialData?: any) {
  const [updates, setUpdates] = useState<Update[]>(initialData?.updates || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(
    initialData ? initialData.hasMore : true,
  );
  const [nextLink, setNextLink] = useState<string | null>(
    initialData?.nextLink || null,
  );

  const loadUpdates = useCallback(
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

        const response = await fetch(`/api/updates?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch updates");
        const result = await response.json();

        if (isInitial) {
          setUpdates(result.updates);
        } else {
          setUpdates((prev) => [...prev, ...result.updates]);
        }

        setHasMore(result.hasMore);
        setNextLink(result.nextLink);
      } catch (err: any) {
        console.error("Error loading updates:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMore, nextLink, initialLimit],
  );

  useEffect(() => {
    if (!initialData) {
      loadUpdates(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    setUpdates([]);
    setNextLink(null);
    setHasMore(true);
    loadUpdates(true);
  }, [loadUpdates]);

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

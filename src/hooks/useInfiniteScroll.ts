"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Hook for infinite scroll / lazy loading
 * @param {Function} loadMore - Function to call when reaching bottom
 * @param {boolean} hasMore - Whether there's more data to load
 * @param {boolean} isLoading - Whether currently loading
 */
export function useInfiniteScroll<T extends HTMLElement>(
  loadMore: () => void,
  hasMore: boolean,
  isLoading: boolean,
): any {
  const observerTarget = useRef<T>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [loadMore, hasMore, isLoading],
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: "100px", // Start loading 100px before reaching bottom
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  return observerTarget as any;
}

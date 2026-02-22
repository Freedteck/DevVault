"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useUpdates } from "../../hooks/useUpdates";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import styles from "../../components/pages/Updates.module.css";
import UpdateCardNew from "./UpdateCardNew";
import QuestionSkeleton from "./QuestionSkeleton";

interface UpdatesFeedProps {
  searchTerm: string;
  activeFilter: string;
  initialData?: any;
}

export default function UpdatesFeed({
  searchTerm,
  activeFilter,
  initialData,
}: UpdatesFeedProps) {
  const { updates, isLoading, error, hasMore, loadMore } = useUpdates(
    10,
    initialData,
  );

  const observerTarget = useInfiniteScroll<HTMLDivElement>(
    loadMore,
    hasMore,
    isLoading,
  );

  const filteredUpdates = useMemo(() => {
    let filtered = updates.filter((u: any) => {
      if (!u) return false;

      const matchesSearch =
        u.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.tags?.some((t: any) =>
          t.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      return matchesSearch;
    });

    if (activeFilter === "newest") {
      filtered.sort(
        (a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0),
      );
    }

    return filtered;
  }, [updates, searchTerm, activeFilter]);

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          color: "var(--apex-danger)",
          marginBottom: "1rem",
        }}
      >
        Error loading updates: {error}
      </div>
    );
  }

  if (isLoading && updates.length === 0) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <QuestionSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredUpdates.length === 0 && !isLoading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          color: "var(--apex-text-muted)",
        }}
      >
        {searchTerm
          ? `No updates found matching "${searchTerm}"`
          : "No updates yet. Be the first to share news!"}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {filteredUpdates.map((update: any) => (
        <UpdateCardNew key={update.updateId || update.id} update={update} />
      ))}

      <div
        ref={observerTarget}
        style={{ gridColumn: "1/-1", height: "20px" }}
      />

      {isLoading && hasMore && (
        <div
          style={{
            gridColumn: "1/-1",
            textAlign: "center",
            padding: "2rem",
            color: "var(--apex-text-muted)",
          }}
        >
          <Loader2
            size={24}
            className="animate-spin"
            style={{ margin: "0 auto" }}
          />
          <p style={{ marginTop: "0.5rem" }}>Loading more updates...</p>
        </div>
      )}

      {!hasMore && updates.length > 0 && (
        <div
          style={{
            gridColumn: "1/-1",
            textAlign: "center",
            padding: "2rem",
            color: "var(--apex-text-muted)",
            fontSize: "0.875rem",
          }}
        >
          🎉 You have reached the end!
        </div>
      )}
    </div>
  );
}

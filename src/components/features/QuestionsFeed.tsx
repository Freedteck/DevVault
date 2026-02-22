"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useQuestions } from "../../hooks/useQuestions";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import styles from "../../app/questions/questions.module.css";
import QuestionCardNew from "./QuestionCardNew";
import QuestionSkeleton from "./QuestionSkeleton";

interface QuestionsFeedProps {
  searchTerm: string;
  activeFilter: string;
  initialData?: any;
}

export default function QuestionsFeed({
  searchTerm,
  activeFilter,
  initialData,
}: QuestionsFeedProps) {
  const { questions, isLoading, error, hasMore, loadMore } = useQuestions(
    10,
    initialData,
  );

  const observerTarget = useInfiniteScroll<HTMLDivElement>(
    loadMore,
    hasMore,
    isLoading,
  );

  const filteredQuestions = useMemo(() => {
    let filtered = questions.filter((q: any) => {
      if (!q) return false;

      const matchesSearch =
        q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags?.some((t: string) =>
          t.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      if (activeFilter === "bounties") {
        return matchesSearch && q.bounty > 0;
      }

      return matchesSearch;
    });

    if (activeFilter === "newest") {
      filtered.sort(
        (a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0),
      );
    }

    return filtered;
  }, [questions, searchTerm, activeFilter]);

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
        Error loading questions: {error}
      </div>
    );
  }

  if (isLoading && questions.length === 0) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <QuestionSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filteredQuestions.length === 0 && !isLoading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          color: "var(--apex-text-muted)",
        }}
      >
        {searchTerm
          ? `No questions found matching "${searchTerm}"`
          : "No questions yet. Be the first to ask!"}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {filteredQuestions.map((q: any) => (
        <QuestionCardNew key={q.questionId || q.id} question={q} />
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
          <p style={{ marginTop: "0.5rem" }}>Loading more questions...</p>
        </div>
      )}

      {!hasMore && questions.length > 0 && (
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

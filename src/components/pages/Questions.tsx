"use client";

import { useState, useMemo } from "react";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import FilterBar from "../features/FilterBar";
import QuestionCardNew from "../features/QuestionCardNew";
import NeonButton from "../ui/NeonButton";
import CreateQuestionModalNew from "../features/CreateQuestionModalNew";
import { useQuestions } from "../../hooks/useQuestions";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import styles from "./Questions.module.css";

const QuestionsNew = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("newest");

  const { questions, isLoading, error, hasMore, loadMore, refresh } =
    useQuestions(10);

  const observerTarget = useInfiniteScroll(loadMore, hasMore, isLoading);

  const filteredQuestions = useMemo(() => {
    let filtered = questions.filter((q: any) => {
      if (!q) return false;

      const matchesSearch =
        q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags?.some((t: any) =>
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Questions Feed</h1>
          <p className={styles.subtitle}>
            Earn crypto by solving real-world development challenges.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <NeonButton
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={16} />}
            onClick={refresh}
            disabled={isLoading}
          >
            Refresh
          </NeonButton>
          <NeonButton
            icon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Ask Question
          </NeonButton>
        </div>
      </div>

      <CreateQuestionModalNew
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refresh();
        }}
      />

      <FilterBar onSearch={setSearchTerm} onFilterChange={setActiveFilter} />

      {error && (
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
      )}

      <div className={styles.grid}>
        {filteredQuestions.length > 0 ? (
          <>
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
          </>
        ) : isLoading ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "4rem",
              color: "var(--apex-text-muted)",
            }}
          >
            <Loader2
              size={32}
              className="animate-spin"
              style={{ margin: "0 auto" }}
            />
            <p style={{ marginTop: "1rem" }}>Loading questions...</p>
          </div>
        ) : (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "4rem",
              color: "var(--apex-text-muted)",
            }}
          >
            {searchTerm
              ? `No questions found matching "${searchTerm}"`
              : "No questions yet. Be the first to ask!"}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsNew;

import { useState, useMemo } from "react";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import FilterBar from "../features/FilterBar";
import QuestionCardNew from "../features/QuestionCardNew";
import NeonButton from "../ui/NeonButton";
import CreateQuestionModalNew from "../features/CreateQuestionModalNew";
import { useQuestions } from "../../../hooks/useQuestions";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import styles from "./Questions.module.css";

const QuestionsNew = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("newest");

  // Fetch real questions from HCS with pagination
  const { questions, isLoading, error, hasMore, loadMore, refresh } =
    useQuestions(10);

  // Infinite scroll observer
  const observerTarget = useInfiniteScroll(loadMore, hasMore, isLoading);

  // Filter and sort questions client-side
  const filteredQuestions = useMemo(() => {
    let filtered = questions.filter((q) => {
      if (!q) return false;

      const matchesSearch =
        q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      if (activeFilter === "bounties") {
        return matchesSearch && q.bounty > 0;
      }

      return matchesSearch;
    });

    // Sort by date if 'newest' (already sorted from HCS but apply to filtered)
    if (activeFilter === "newest") {
      filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    return filtered;
  }, [questions, searchTerm, activeFilter]);

  return (
    <div className={styles.container}>
      {/* Page Header */}
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
          // Refresh questions after posting
          refresh();
        }}
      />

      {/* Inputs */}
      <FilterBar onSearch={setSearchTerm} onFilterChange={setActiveFilter} />

      {/* Error State */}
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

      {/* Grid */}
      <div className={styles.grid}>
        {filteredQuestions.length > 0 ? (
          <>
            {filteredQuestions.map((q) => (
              <QuestionCardNew key={q.questionId || q.id} question={q} />
            ))}

            {/* Infinite Scroll Observer Target */}
            <div
              ref={observerTarget}
              style={{ gridColumn: "1/-1", height: "20px" }}
            />

            {/* Loading More Indicator */}
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

            {/* No More Data */}
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

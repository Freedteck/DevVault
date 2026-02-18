import React, { useState, useMemo } from "react";
import { Newspaper, RefreshCw, Loader2 } from "lucide-react";
import FilterBar from "../features/FilterBar";
import UpdateCardNew from "../features/UpdateCardNew";
import NeonButton from "../ui/NeonButton";
import CreateUpdateModalNew from "../features/CreateUpdateModalNew";
import { useUpdates } from "../../../hooks/useUpdates";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import styles from "./Updates.module.css";

const UpdatesNew = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("newest");

  // Fetch real updates from HCS
  const { updates, isLoading, error, hasMore, loadMore, refresh } =
    useUpdates(10);

  // Infinite scroll observer
  const observerTarget = useInfiniteScroll(loadMore, hasMore, isLoading);

  // Filter updates client-side
  const filteredUpdates = useMemo(() => {
    let filtered = updates.filter((u) => {
      if (!u) return false;

      const matchesSearch =
        u.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });

    // Sort by date if 'newest'
    if (activeFilter === "newest") {
      filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    return filtered;
  }, [updates, searchTerm, activeFilter]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Developer News</h1>
          <p className={styles.subtitle}>
            Latest updates from the Hedera ecosystem.
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
            variant="cyan"
            icon={<Newspaper size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Submit News
          </NeonButton>
        </div>
      </div>

      <CreateUpdateModalNew
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refresh();
        }}
      />

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
          Error loading updates: {error}
        </div>
      )}

      <FilterBar onSearch={setSearchTerm} onFilterChange={setActiveFilter} />

      <div className={styles.grid}>
        {filteredUpdates.length > 0 ? (
          <>
            {filteredUpdates.map((update) => (
              <UpdateCardNew
                key={update.updateId || update.id}
                update={update}
              />
            ))}

            {/* Infinite Scroll Observer */}
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
                <p style={{ marginTop: "0.5rem" }}>Loading more updates...</p>
              </div>
            )}

            {/* No More Data */}
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
            <p style={{ marginTop: "1rem" }}>Loading updates...</p>
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
              ? `No updates found matching "${searchTerm}"`
              : "No updates yet. Be the first to share news!"}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesNew;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import UpdateCard from "../../components/features/UpdateCard";
import CreateUpdateModal from "../../components/features/CreateUpdateModal";
import SearchBar from "../../components/features/SearchBar";
import { useUpdates } from "../../hooks/useHCSData";
import styles from "./Updates.module.css";

const Updates = () => {
  const navigate = useNavigate();
  const { data: updates, isLoading, refetch, hasMore, loadMore } = useUpdates();
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setFilteredUpdates(updates);
  }, [updates]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUpdates(updates);
    } else {
      const filtered = updates.filter(
        (u) =>
          u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUpdates(filtered);
    }
  }, [searchQuery, updates]);

  const handleUpdateClick = (update) => {
    navigate(`/update/${update.sequence_number}`, { state: { update } });
  };

  const handleSuccess = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <div className={styles.updates}>
        <div className={styles.loading}>Loading updates...</div>
      </div>
    );
  }

  return (
    <div className={styles.updates}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Developer Updates</h1>
          <p className={styles.subtitle}>
            Stay informed with the latest frameworks, tools, and industry trends
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Create Update
        </Button>
      </div>

      <div className={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search updates..."
        />
      </div>

      {filteredUpdates.length === 0 && !isLoading ? (
        <div className={styles.empty}>
          <p>
            {searchQuery
              ? "No updates match your search"
              : "No updates yet. Be the first to share!"}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {filteredUpdates.map((update) => (
              <UpdateCard
                key={update.sequence_number}
                update={update}
                onClick={() => handleUpdateClick(update)}
              />
            ))}
          </div>
          {hasMore && !searchQuery && (
            <div className={styles.loadMore}>
              <Button
                variant="outline"
                onClick={async () => {
                  setIsLoadingMore(true);
                  await loadMore();
                  setIsLoadingMore(false);
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <CreateUpdateModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Updates;

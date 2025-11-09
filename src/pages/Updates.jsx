import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Button from "../components/ui/Button";
import UpdateCard from "../components/features/UpdateCard";
import CreateUpdateModal from "../components/features/CreateUpdateModal";
import SearchBar from "../components/features/SearchBar";
import styles from "./Updates.module.css";

const Updates = () => {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const topicId = import.meta.env.VITE_TOPIC_ID;

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
        );
        const data = await response.json();

        const messages = data.messages
          .map((message) => {
            try {
              const decodedMessage = atob(message.message);
              return JSON.parse(decodedMessage);
            } catch {
              return null;
            }
          })
          .filter((msg) => msg && msg.type === "update")
          .reverse();

        setUpdates(messages);
        setFilteredUpdates(messages);
      } catch (error) {
        console.error("Failed to fetch updates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpdates();
  }, [topicId]);

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

  const handleUpdateClick = (update, index) => {
    navigate(`/update/${index + 1}`, { state: { update } });
  };

  const handleSuccess = (newUpdate) => {
    setUpdates((prev) => [newUpdate, ...prev]);
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
        <div className={styles.grid}>
          {filteredUpdates.map((update, index) => (
            <UpdateCard
              key={index}
              update={update}
              onClick={() => handleUpdateClick(update, index)}
            />
          ))}
        </div>
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

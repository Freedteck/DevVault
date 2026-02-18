import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Share2, Coins, Loader2 } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import TipModal from "../features/TipModal";
import { fetchUpdates } from "../../../services/fetchService";
import styles from "./QuestionDetails.module.css"; // Reusing layout styles

const UpdateDetailsNew = () => {
  const { id: updateId } = useParams();
  const [update, setUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState(null);

  const gateway = import.meta.env.VITE_PINATA_GATEWAY;

  // Fetch update by ID
  useEffect(() => {
    const loadUpdate = async () => {
      try {
        setIsLoading(true);

        // Fetch all updates and find the one we need
        // In a production app, you'd want a dedicated endpoint for single update
        let allUpdates = [];
        let nextLink = null;

        do {
          const result = await fetchUpdates(100, nextLink, gateway);
          allUpdates = [...allUpdates, ...result.updates];
          nextLink = result.nextLink;

          // Check if we found our update
          const foundUpdate = allUpdates.find((u) => u.updateId === updateId);
          if (foundUpdate) {
            setUpdate(foundUpdate);
            setIsLoading(false);
            return;
          }
        } while (nextLink);

        // If we get here, update not found
        setError("Update not found");
      } catch (err) {
        console.error("Error loading update:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (updateId) {
      loadUpdate();
    }
  }, [updateId, gateway]);

  const handleOpenTip = (authorName) => {
    setTipTarget(authorName);
    setIsTipModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Loader2
            size={32}
            className="animate-spin"
            style={{ margin: "0 auto" }}
          />
          <p>Loading update...</p>
        </div>
      </div>
    );
  }

  if (error || !update) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to load update: {error || "Update not found"}</p>
          <Link to="/updates">
            <NeonButton>Back to Updates</NeonButton>
          </Link>
        </div>
      </div>
    );
  }

  // Handle author format
  const authorData =
    typeof update.author === "string"
      ? {
          username: update.author,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${update.author}`,
        }
      : update.author;

  return (
    <div className={styles.container}>
      <Link to="/updates" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to News
      </Link>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <GlassCard className={styles.questionCard}>
            <div className={styles.meta}>
              <span
                className={styles.tag}
                style={{
                  background: "var(--apex-primary-500)",
                  color: "white",
                }}
              >
                News
              </span>
            </div>

            <h1 className={styles.title}>{update.title}</h1>

            <div
              className={styles.meta}
              style={{
                borderBottom: "1px solid var(--glass-border)",
                paddingBottom: "16px",
              }}
            >
              <div className={styles.author}>
                <img
                  src={authorData.avatar}
                  alt={authorData.username}
                  className={styles.avatar}
                />
                <span className={styles.username}>{authorData.username}</span>
              </div>
              <span className={styles.dot}>•</span>
              <span className={styles.date}>
                <Calendar size={14} />{" "}
                {new Date(update.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div
              className={styles.description}
              style={{ fontSize: "1.1rem", whiteSpace: "pre-wrap" }}
            >
              {update.content}
            </div>

            {update.tags && update.tags.length > 0 && (
              <div className={styles.tags} style={{ marginTop: "1rem" }}>
                {update.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div
              className={styles.bountyBar}
              style={{
                background: "rgba(99, 102, 241, 0.05)",
                borderColor: "var(--glass-border)",
              }}
            >
              <div className={styles.author} style={{ gap: "16px" }}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleOpenTip(authorData.username)}
                >
                  <Coins size={18} /> Tip Author
                </button>
                <button className={styles.actionBtn}>
                  <Share2 size={18} /> Share
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Comments section removed for now - can be added later with COMMENTS topic */}
        </div>

        {/* Sidebar removed for simplicity */}
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        targetName={tipTarget}
        onConfirm={(amount) => {
          import("react-hot-toast").then(({ default: toast }) => {
            toast.success(`Successfully sent ${amount} HBAR to ${tipTarget}`);
          });
          setIsTipModalOpen(false);
        }}
      />
    </div>
  );
};

export default UpdateDetailsNew;

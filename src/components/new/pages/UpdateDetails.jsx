import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Share2,
  Coins,
  Loader2,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import MarkdownEditor from "../ui/MarkdownEditor";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import ExpandableContent from "../ui/ExpandableContent";
import TipModal from "../features/TipModal";
import { fetchUpdates, fetchComments } from "../../../services/fetchService";
import { submitComment } from "../../../services/hcsService";
import { userWalletContext } from "../../../context/userWalletContext";
import styles from "./QuestionDetails.module.css";

const UpdateDetailsNew = () => {
  const { id: updateId } = useParams();
  const { accountId, walletData } = useContext(userWalletContext);
  const [update, setUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const gateway = import.meta.env.VITE_PINATA_GATEWAY;

  // Fetch update by ID
  useEffect(() => {
    const loadUpdate = async () => {
      try {
        setIsLoading(true);

        let allUpdates = [];
        let nextLink = null;

        do {
          const result = await fetchUpdates(100, nextLink, gateway);
          allUpdates = [...allUpdates, ...result.updates];
          nextLink = result.nextLink;

          const foundUpdate = allUpdates.find((u) => u.updateId === updateId);
          if (foundUpdate) {
            setUpdate(foundUpdate);
            setIsLoading(false);
            return;
          }
        } while (nextLink);

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

  // Fetch comments for this update
  useEffect(() => {
    const loadComments = async () => {
      if (!updateId || !gateway) return;

      try {
        setIsLoadingComments(true);
        const fetchedComments = await fetchComments(updateId, gateway);
        setComments(fetchedComments);
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setIsLoadingComments(false);
      }
    };

    loadComments();
  }, [updateId, gateway]);

  const handleOpenTip = (authorName) => {
    setTipTarget(authorName);
    setIsTipModalOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!accountId || !walletData) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!commentContent.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setIsSubmittingComment(true);
      toast.loading("Posting comment...");

      const commentData = {
        parentId: updateId,
        parentType: "update",
        content: commentContent.trim(),
      };

      const result = await submitComment(commentData, walletData, accountId);

      toast.dismiss();
      toast.success("Comment posted successfully!");

      // Add comment to local state for instant feedback
      const newComment = {
        id: result.commentId,
        content: commentContent.trim(),
        author: {
          username: accountId,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${accountId}`,
        },
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      setComments([...comments, newComment]);
      setCommentContent("");

      // Refresh comments after delay for HCS confirmation
      setTimeout(async () => {
        const refreshedComments = await fetchComments(updateId, gateway);
        setComments(refreshedComments);
      }, 3000);
    } catch (err) {
      console.error("Error submitting comment:", err);
      toast.dismiss();
      toast.error("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
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
              <span className={styles.dot}>•</span>
              <div className={styles.tags}>
                {update.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    #{t}
                  </span>
                ))}
              </div>
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

            <MarkdownRenderer
              content={update.content}
              className={styles.description}
              style={{ fontSize: "1.1rem" }}
            />

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

          <div className={styles.divider} />

          <h3 className={styles.sectionTitle}>
            {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
          </h3>

          {isLoadingComments && comments.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Loader2
                size={24}
                className="animate-spin"
                style={{ margin: "0 auto" }}
              />
              <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "1rem" }}>
                Loading comments...
              </p>
            </div>
          )}

          {comments.length > 0 && (
            <div className={styles.answersList}>
              {comments.map((comment) => (
                <GlassCard key={comment.id} className={styles.answerCard}>
                  <div className={styles.answerHeader}>
                    <div className={styles.author}>
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.username}
                        className={styles.avatar}
                      />
                      <div>
                        <span className={styles.username}>
                          {comment.author.username}
                        </span>
                        <span
                          className={styles.date}
                          style={{ marginLeft: "8px", fontSize: "0.875rem" }}
                        >
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <ExpandableContent
                      content={comment.content}
                      maxLength={400}
                      className={styles.answerContent}
                    />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          <GlassCard className={styles.postArea}>
            <h3 className={styles.postTitle}>Post a Comment</h3>
            <MarkdownEditor
              value={commentContent}
              onChange={(value) => setCommentContent(value)}
              placeholder="Share your thoughts... Markdown supported!"
              minRows={4}
            />
            <div className={styles.postActions}>
              <NeonButton
                icon={<Send size={16} />}
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || !commentContent.trim()}
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </NeonButton>
            </div>
          </GlassCard>
        </div>

        <aside className={styles.sidebar}>
          <GlassCard className={styles.sidebarCard}>
            <h4>Related Updates</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="#">Hedera Council announces HIP-402</a>
              </li>
              <li>
                <a href="#">New SDK features for Testnet</a>
              </li>
              <li>
                <a href="#">HashPack Wallet Updates</a>
              </li>
            </ul>
          </GlassCard>

          <GlassCard
            className={styles.sidebarCard}
            style={{ marginTop: "1rem" }}
          >
            <h4>About the Author</h4>
            <div className={styles.author} style={{ marginTop: "1rem" }}>
              <img
                src={authorData.avatar}
                alt={authorData.username}
                className={styles.avatar}
              />
              <div>
                <div className={styles.username}>{authorData.username}</div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.6)",
                    marginTop: "4px",
                  }}
                >
                  Community Contributor
                </div>
              </div>
            </div>
          </GlassCard>
        </aside>
      </div>

      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        targetName={tipTarget}
        onConfirm={async (amount) => {
          try {
            if (!accountId || !walletData) {
              toast.error("Please connect your wallet first");
              return;
            }

            toast.loading(`Sending ${amount} HBAR to ${tipTarget}...`);

            const { Hbar, TransferTransaction } =
              await import("@hashgraph/sdk");
            const { AccountId } = await import("@hashgraph/sdk");

            const signer = walletData.getSigner(
              AccountId.fromString(accountId),
            );
            const transaction = new TransferTransaction()
              .addHbarTransfer(accountId, Hbar.from(-amount))
              .addHbarTransfer(tipTarget, Hbar.from(amount));

            await signer.call(transaction);

            toast.dismiss();
            toast.success(`Successfully sent ${amount} HBAR to ${tipTarget}`);
            setIsTipModalOpen(false);
          } catch (error) {
            console.error("Tip transfer error:", error);
            toast.dismiss();
            toast.error(`Failed to send tip: ${error.message}`);
          }
        }}
      />
    </div>
  );
};

export default UpdateDetailsNew;

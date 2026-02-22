"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Share2,
  Coins,
  ExternalLink,
  Loader2,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { Hbar, TransferTransaction, AccountId } from "@hashgraph/sdk";
import Image from "next/image";

import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import MarkdownEditor from "../ui/MarkdownEditor";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import TipModal from "../features/TipModal";
import AnswerCardNew from "../features/AnswerCardNew";
import DetailSkeleton from "../features/DetailSkeleton";

import { submitComment } from "../../services/hcsService";
import { userWalletContext } from "../../context/userWalletContext";
import styles from "./QuestionDetails.module.css";

interface UpdateDetailsProps {
  initialUpdate?: any;
  initialComments?: any[];
}

const UpdateDetailsNew = ({
  initialUpdate,
  initialComments,
}: UpdateDetailsProps) => {
  const params = useParams();
  const sequenceNumber = params?.sequenceNumber as string;
  const { accountId, walletData } = useContext(userWalletContext);

  const [update, setUpdate] = useState<any>(initialUpdate || null);
  const [isLoading, setIsLoading] = useState(!initialUpdate);
  const [error, setError] = useState<any>(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState<any>(null);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>(initialComments || []);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const loadComments = useCallback(async (updateId: string) => {
    try {
      setIsLoadingComments(true);
      const res = await fetch(`/api/comments/${updateId}`);
      if (!res.ok) return;
      setComments(await res.json());
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!sequenceNumber) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/updates/${sequenceNumber}`);
      if (!res.ok) throw new Error("Failed to fetch update");
      const data = await res.json();
      setUpdate(data);
      if (data.updateId) {
        loadComments(data.updateId);
      }
    } catch (err: any) {
      console.error("Error refreshing update data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sequenceNumber, loadComments]);

  useEffect(() => {
    if (!initialUpdate && sequenceNumber) {
      refreshData();
    } else if (initialUpdate && initialUpdate.updateId && !initialComments) {
      loadComments(initialUpdate.updateId);
    }
  }, [
    sequenceNumber,
    initialUpdate,
    initialComments,
    refreshData,
    loadComments,
  ]);

  const handleOpenTip = (authorName: any) => {
    setTipTarget(authorName);
    setIsTipModalOpen(true);
  };

  const handleTipConfirm = async (amount: any) => {
    try {
      if (!accountId || !walletData) {
        toast.error("Please connect your wallet first");
        return;
      }

      toast.loading(`Sending ${amount} HBAR to ${tipTarget}...`);

      const signer = (walletData as any).getSigner(
        AccountId.fromString(accountId),
      );
      const hbarAmount = new Hbar(Number(amount));
      const transaction = new TransferTransaction()
        .addHbarTransfer(accountId, hbarAmount.negated())
        .addHbarTransfer(tipTarget, hbarAmount);

      await signer.call(transaction);

      toast.dismiss();
      toast.success(`Successfully sent ${amount} HBAR to ${tipTarget}`);
      setIsTipModalOpen(false);
    } catch (error: any) {
      console.error("Tip transfer error:", error);
      toast.dismiss();
      toast.error(`Failed to send tip: ${error.message}`);
    }
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
        parentId: update.updateId,
        parentType: "update" as const,
        content: commentContent.trim(),
      };

      const result = await submitComment(commentData, walletData, accountId);

      toast.dismiss();
      toast.success("Comment posted successfully!");

      const newComment = {
        id: result.commentId,
        commentId: result.commentId,
        parentId: update.updateId,
        content: commentContent.trim(),
        author: {
          username: accountId,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${accountId}`,
          rank: "Contributor",
        },
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      setComments((prev) => [...prev, newComment]);
      setCommentContent("");

      setTimeout(() => loadComments(update.updateId), 3000);
    } catch (err) {
      console.error("Error submitting comment:", err);
      toast.dismiss();
      toast.error("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !update) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to load update: {error || "Update not found"}</p>
          <Link href="/updates">
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
      <Link href="/updates" className={styles.backLink}>
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
                {update.tags &&
                  update.tags.map((t: any) => (
                    <span key={t} className={styles.tag}>
                      #{t}
                    </span>
                  ))}
              </div>
            </div>

            {update.image && (
              <div className={styles.postBanner}>
                <Image
                  src={update.image}
                  width={800}
                  height={400}
                  alt={update.title}
                  className={styles.bannerImg}
                  priority
                />
              </div>
            )}

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

            {update.url && (
              <a
                href={update.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--apex-primary-400)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                }}
              >
                <ExternalLink size={14} /> Read original source
              </a>
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
              {comments.map((comment: any) => (
                <AnswerCardNew key={comment.id} answer={comment} />
              ))}
            </div>
          )}

          <GlassCard className={styles.postArea}>
            <h3 className={styles.postTitle}>Post a Comment</h3>
            <MarkdownEditor
              value={commentContent}
              onChange={(value: any) => setCommentContent(value)}
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
        onConfirm={handleTipConfirm}
      />
    </div>
  );
};

export default UpdateDetailsNew;

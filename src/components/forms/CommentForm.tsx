"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/ToastContext";
import { userPostComment } from "@/lib/hedera-client-tx";
import { useRouter } from "next/navigation";

interface CommentFormProps {
  discussionTopicId: string;
  placeholder?: string;
  onSuccess?: () => void;
}

export function CommentForm({
  discussionTopicId,
  placeholder = "Share your thoughts...",
  onSuccess,
}: CommentFormProps) {
  const [commentBody, setCommentBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accountId, isConnected, connector, profile } = useWallet();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!isConnected || !accountId || !connector) {
      showToast("Please connect your wallet first.", "error");
      return;
    }

    if (!commentBody.trim()) {
      showToast("Comment cannot be empty.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await userPostComment(connector, {
        discussionTopicId,
        body: commentBody.trim(),
        author: {
          accountId,
          displayName: profile?.displayName ?? accountId,
        },
      });

      showToast("Comment posted to Hedera!", "success");
      setCommentBody("");

      // Trigger manual revalidation for the current page
      try {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: window.location.pathname,
            secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
          }),
        });
      } catch (revalErr) {
        console.warn("Manual revalidation failed:", revalErr);
      }

      router.refresh(); // Refresh server components to show the new comment
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to post comment:", err);
      showToast(`Failed to post comment: ${String(err)}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-dashed border-border-main p-6 text-center bg-bg-panel/50">
        <p className="text-sm text-text-muted">
          Connect your wallet to join the discussion.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-main bg-bg-panel p-4">
      <textarea
        placeholder={placeholder}
        value={commentBody}
        onChange={(e) => setCommentBody(e.target.value)}
        disabled={isSubmitting}
        className="w-full h-24 bg-transparent border-none outline-none text-sm text-text-primary resize-none font-sans disabled:opacity-50"
      />
      <div className="flex items-center justify-end mt-4 border-t border-border-main pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !commentBody.trim()}
          className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </div>
  );
}

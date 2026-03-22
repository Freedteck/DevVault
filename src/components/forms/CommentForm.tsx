"use client";

import { useState, useRef } from "react";
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (
    prefix: string,
    suffix: string,
    placeholder: string,
  ) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const textToInsert = selectedText || placeholder;
    const newText =
      value.substring(0, selectionStart) +
      prefix +
      textToInsert +
      suffix +
      value.substring(selectionEnd);

    setCommentBody(newText);

    setTimeout(() => {
      el.focus();
      if (selectedText) {
        el.setSelectionRange(
          selectionStart + prefix.length,
          selectionEnd + prefix.length,
        );
      } else {
        el.setSelectionRange(
          selectionStart + prefix.length,
          selectionStart + prefix.length + placeholder.length,
        );
      }
    }, 0);
  };

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
    <div className="rounded-lg border border-border-main bg-bg-panel overflow-hidden focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/50 transition-all">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-bg-subtle border-b border-border-main">
        <button
          onClick={() => insertMarkdown("**", "**", "bold text")}
          type="button"
          title="Bold"
          className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-bold text-text-secondary transition-colors"
        >
          B
        </button>
        <button
          onClick={() => insertMarkdown("*", "*", "italic text")}
          type="button"
          title="Italic"
          className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] italic text-text-secondary transition-colors"
        >
          I
        </button>
        <button
          onClick={() => insertMarkdown("`", "`", "code")}
          type="button"
          title="Inline code"
          className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-mono text-text-secondary transition-colors"
        >
          &lt;&gt;
        </button>
        <button
          onClick={() => insertMarkdown("```\n", "\n```", "code here")}
          type="button"
          title="Code block"
          className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-mono text-text-secondary transition-colors"
        >
          {"{}"}
        </button>
        <button
          onClick={() => insertMarkdown("[", "](url)", "link text")}
          type="button"
          title="Link"
          className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] text-text-secondary transition-colors"
        >
          Link
        </button>
        <button
          onClick={() => insertMarkdown("- ", "", "item")}
          type="button"
          title="List item"
          className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] text-text-secondary transition-colors"
        >
          List
        </button>
        <span className="ml-auto text-[10px] text-text-muted pr-1">
          Markdown
        </span>
      </div>
      <textarea
        ref={bodyRef}
        placeholder={placeholder}
        value={commentBody}
        onChange={(e) => setCommentBody(e.target.value)}
        disabled={isSubmitting}
        className="w-full h-40 p-4 bg-transparent outline-none text-sm text-text-secondary font-mono resize-none leading-relaxed disabled:opacity-50"
      />
      <div className="flex items-center justify-end px-4 py-3 border-t border-border-main bg-bg-subtle">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !commentBody.trim()}
          className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing..." : "Post Comment"}
        </button>
      </div>
    </div>
  );
}

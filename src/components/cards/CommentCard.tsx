"use client";

import { useState } from "react";
import type { LiveComment, LiveReply } from "@/lib/live-types";
import { Avatar, Timestamp } from "@/components/ui/primitives";
import { MarkdownBody } from "@/components/ui/MarkdownBody";

const EXCERPT_LEN = 160;

interface CommentCardProps {
  comment: LiveComment;
  onTip?: (displayName: string, accountId: string) => void;
  onReply?: () => void;
  replies?: LiveReply[];
  replyingTo?: boolean;
  replyBody?: string;
  isSubmittingReply?: boolean;
  onReplyBodyChange?: (value: string) => void;
  onSubmitReply?: () => void;
}

export function CommentCard({
  comment,
  onTip,
  onReply,
  replies = [],
  replyingTo = false,
  replyBody = "",
  isSubmittingReply = false,
  onReplyBodyChange,
  onSubmitReply,
}: CommentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isLong = comment.body.length > EXCERPT_LEN;
  const excerpt = isLong
    ? comment.body.slice(0, EXCERPT_LEN).replace(/\s+\S*$/, "") + "…"
    : comment.body;

  return (
    <div className="rounded-lg bg-bg-panel border border-border-main transition-colors duration-150">
      {/* Header — always visible */}
      <div
        className="flex flex-wrap items-center justify-between gap-y-2 px-5 pt-5 pb-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            accountId={comment.author.accountId}
            displayName={comment.author.displayName}
            size={28}
          />
          <div className="flex items-center h-full">
            <span className="text-border-main/50 self-stretch border-l border-border-main mx-1 ml-2" />
            <Timestamp iso={comment.consensusTimestamp} />
          </div>
        </div>

        {/* Expand / collapse control */}
        <div className="flex items-center gap-2 shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Collapsed excerpt */}
      {!expanded && (
        <div
          className="px-5 pb-4 cursor-pointer"
          onClick={() => setExpanded(true)}
        >
          <MarkdownBody
            content={excerpt}
            className="text-sm pointer-events-none"
          />
        </div>
      )}

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 mb-4">
          <MarkdownBody content={comment.body} className="text-sm mb-4" />

          {/* Replies Thread */}
          {replies.length > 0 && (
            <div className="space-y-3 mb-4 pl-4 border-l-2 border-border-main">
              {replies.map((reply) => (
                <div key={reply.sequenceNumber} className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Avatar
                        accountId={reply.author.accountId}
                        displayName={reply.author.displayName}
                        size={22}
                      />
                      <div className="flex items-center h-full">
                        <span className="text-border-main/50 self-stretch border-l border-border-main mx-1 ml-2" />
                        <Timestamp iso={reply.consensusTimestamp} />
                      </div>
                    </div>
                    <MarkdownBody content={reply.body} className="text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline reply form */}
          {replyingTo && (
            <div className="mb-4 pl-4 border-l-2 border-primary-600/40">
              <textarea
                value={replyBody}
                onChange={(e) => onReplyBodyChange?.(e.target.value)}
                disabled={isSubmittingReply}
                placeholder="Write a reply…"
                rows={3}
                className="w-full bg-bg-subtle border border-border-main rounded-md text-sm text-text-primary p-3 resize-none outline-none focus:border-primary-500 transition-colors disabled:opacity-50 font-mono"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={onSubmitReply}
                  disabled={isSubmittingReply || !replyBody.trim()}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReply ? "Signing…" : "Post Reply"}
                </button>
                <button
                  onClick={onReply}
                  disabled={isSubmittingReply}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border-main px-5 py-3 mt-auto">
        <button
          onClick={() =>
            onTip?.(comment.author.displayName, comment.author.accountId)
          }
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border border-border-main text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Tip VRS
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!expanded) setExpanded(true);
            onReply?.();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ml-auto text-text-muted hover:text-text-main"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 10 20 15 15 20" />
            <path d="M4 4v7a4 4 0 0 0 4 4h12" />
          </svg>
          Reply
        </button>
      </div>
    </div>
  );
}

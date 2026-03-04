import { useState } from "react";
import type { LiveAnswer, LiveReply } from "@/lib/live-types";
import { Avatar, Timestamp } from "@/components/ui/primitives";
import { MarkdownBody } from "@/components/ui/MarkdownBody";

const EXCERPT_LEN = 160;

interface AnswerCardProps {
  answer: LiveAnswer;
  onTip?: (displayName: string, accountId: string) => void;
  onAccept?: () => void;
  canAccept?: boolean;
  isAccepting?: boolean;
  replies?: LiveReply[];
  replyingTo?: boolean;
  replyBody?: string;
  isSubmittingReply?: boolean;
  onToggleReply?: () => void;
  onReplyBodyChange?: (value: string) => void;
  onSubmitReply?: () => void;
}

export function AnswerCard({
  answer,
  onTip,
  onAccept,
  canAccept,
  isAccepting = false,
  replies = [],
  replyingTo = false,
  replyBody = "",
  isSubmittingReply = false,
  onToggleReply,
  onReplyBodyChange,
  onSubmitReply,
}: AnswerCardProps) {
  // Accepted answers start expanded; all others start collapsed
  const [expanded, setExpanded] = useState(answer.accepted ?? false);

  const isLong = answer.body.length > EXCERPT_LEN;
  const excerpt = isLong
    ? answer.body.slice(0, EXCERPT_LEN).replace(/\s+\S*$/, "") + "…"
    : answer.body;

  return (
    <div
      className={`rounded-lg border transition-colors duration-150 ${
        answer.accepted
          ? "border-primary-600/50 bg-primary-600/5"
          : "bg-bg-panel border-border-main"
      }`}
    >
      {/* Header — always visible */}
      <div
        className="flex flex-wrap items-center justify-between gap-y-2 px-5 pt-5 pb-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            accountId={answer.author.accountId}
            displayName={answer.author.displayName}
            size={28}
          />
          <div className="flex items-center h-full">
            <span className="text-border-main/50 self-stretch border-l border-border-main mx-1 ml-2" />
            <Timestamp iso={answer.consensusTimestamp} />
          </div>
          {answer.accepted && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-600 text-white">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Solution
            </span>
          )}
        </div>

        {/* Expand / collapse control */}
        <div className="flex items-center gap-2 shrink-0">
          {!expanded && replies.length > 0 && (
            <span className="text-[11px] text-text-muted">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </span>
          )}
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

      {/* Expanded: full body + replies + reply form */}
      {expanded && (
        <div className="px-5">
          {/* Body */}
          <MarkdownBody content={answer.body} className="mb-4" />

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
                  onClick={onToggleReply}
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

      {/* Actions — always visible */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border-main px-5 py-3 mt-auto">
        <button
          onClick={() =>
            onTip?.(answer.author.displayName, answer.author.accountId)
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

        {canAccept && !answer.accepted && (
          <button
            onClick={onAccept}
            disabled={isAccepting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border border-border-main text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {isAccepting ? "Signing..." : "Accept Solution"}
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!expanded) setExpanded(true);
            onToggleReply?.();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ml-auto ${
            replyingTo
              ? "text-primary-400 hover:text-primary-300"
              : "text-text-muted hover:text-text-main"
          }`}
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

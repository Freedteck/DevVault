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
  const isAI =
    answer.isAiAnswer === true ||
    answer.isSpamFlag === true ||
    answer.isAgentComment === true;
  // All answers start collapsed by default
  const [expanded, setExpanded] = useState(false);

  const isLong = answer.body.length > EXCERPT_LEN;
  const excerpt = isLong
    ? answer.body.slice(0, EXCERPT_LEN).replace(/\s+\S*$/, "") + "…"
    : answer.body;

  return (
    <div
      className={`rounded-lg border transition-colors duration-150 ${
        isAI
          ? "border-violet-600/40 bg-violet-600/5"
          : answer.accepted
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
          {isAI ? (
            // AI Agent header
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-600/20 text-violet-400 text-[10px] font-bold">
                AI
              </span>
              <span className="text-sm font-semibold text-violet-300">
                Vurso AI
              </span>
              <span
                className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  answer.isSpamFlag
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-violet-600/20 text-violet-400 border-violet-600/30"
                }`}
              >
                {answer.isSpamFlag ? "Spam Detected" : "AI Answer"}
              </span>
            </div>
          ) : (
            <Avatar
              accountId={answer.author.accountId}
              displayName={answer.author.displayName}
              size={28}
            />
          )}
          {!isAI && (
            <div className="flex items-center h-full">
              <span className="text-border-main/50 self-stretch border-l border-border-main mx-1 ml-2" />
              <Timestamp iso={answer.consensusTimestamp} />
            </div>
          )}
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
          {/* Full body */}
          <MarkdownBody content={answer.body} className="mb-4" />

          {/* AI bounty note */}
          {isAI && answer.hasBounty && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-violet-600/30 bg-violet-600/10 px-3 py-2.5 text-xs text-violet-300">
              <span>
                This question has a bounty. The bounty is for human experts —{" "}
                <strong>post a better answer</strong> to compete for it.
              </span>
            </div>
          )}

          {/* Replies Thread */}
          {replies.length > 0 && (
            <div className="space-y-3 mb-4 pl-4 border-l-2 border-border-main">
              {replies.map((reply) => {
                if (reply.isSpamFlag) {
                  return (
                    <div
                      key={reply.sequenceNumber}
                      className="flex gap-3 mb-3 border-l-2 border-red-500/30 pl-3 ml-1"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 text-[8px] font-bold">
                              AI
                            </span>
                            <span className="text-xs font-semibold text-violet-300">
                              Vurso AI
                            </span>
                            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">
                              Spam Detected
                            </span>
                          </div>
                          <div className="flex items-center h-full">
                            <span className="text-border-main/50 self-stretch border-l border-border-main mx-1 ml-1" />
                            <Timestamp iso={reply.consensusTimestamp} />
                          </div>
                        </div>
                        <MarkdownBody
                          content={reply.body}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  );
                }

                return (
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
                );
              })}
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

      {/* Actions — hidden for AI answers (can't tip or reply-to an AI) */}
      {!isAI && (
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
      )}
    </div>
  );
}

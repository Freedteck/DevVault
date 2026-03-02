import type { LiveAnswer } from "@/lib/live-types";
import { Timestamp, StatPill } from "@/components/ui/primitives";

interface AnswerCardProps {
  answer: LiveAnswer;
  onTip?: (displayName: string, accountId: string) => void;
  onAccept?: () => void;
  canAccept?: boolean;
  isAccepting?: boolean;
}

export function AnswerCard({
  answer,
  onTip,
  onAccept,
  canAccept,
  isAccepting = false,
}: AnswerCardProps) {
  return (
    <div
      className={`rounded-lg border p-5 transition-colors duration-150 ${
        answer.accepted
          ? "border-primary-600/50 bg-primary-600/5"
          : "bg-bg-panel border-border-main"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold shrink-0 bg-primary-800 text-primary-300">
            {answer.author.displayName.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium text-text-main">
            {answer.author.displayName}
          </span>
          <span className="text-border-main">·</span>
          <Timestamp iso={answer.consensusTimestamp} />
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

        <div className="flex items-center gap-3">
          <StatPill
            value={answer.tipTotal ?? 0}
            label="DVT"
            variant="primary"
          />
        </div>
      </div>

      {/* Body */}
      <div className="text-sm leading-relaxed text-text-secondary mb-6 whitespace-pre-wrap font-sans">
        {answer.body}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-border-main pt-4 mt-auto">
        <button
          onClick={() => onTip?.(answer.author.displayName, answer.author.accountId)}
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
          Tip DVT
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

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-text-muted hover:text-text-main transition-colors ml-auto">
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

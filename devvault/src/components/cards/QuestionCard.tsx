import Link from "next/link";
import type { LiveQuestion } from "@/lib/live-types";
import { Tag, Timestamp, StatPill } from "@/components/ui/primitives";

interface QuestionCardProps {
  question: LiveQuestion;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Link
      href={`/questions/${question.sequenceNumber}`}
      className="block rounded-lg border bg-bg-panel border-border-main hover:border-primary-600 transition-colors duration-150"
    >
      <div className="px-5 py-4">
        {/* Top Row: bounty + accepted badge */}
        <div className="flex items-center gap-2 mb-2.5">
          {question.accepted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-600/15 text-primary-400">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Accepted
            </span>
          )}
          {question.bountyAmount && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-500">
              {question.bountyAmount} {question.bountyCurrency} bounty
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-medium leading-snug mb-2 text-text-main">
          {question.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm leading-relaxed mb-3 line-clamp-2 text-text-secondary">
          {question.shortDescription || "No description provided."}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {question.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Author */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 bg-primary-800 text-primary-300">
              {question.author.displayName.charAt(0).toUpperCase()}
            </span>
            <span className="text-[12px] text-text-muted">
              {question.author.displayName}
            </span>
            <span className="text-border-main">·</span>
            <Timestamp iso={question.consensusTimestamp} />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <StatPill
              value={question.answerCount ?? 0}
              label={question.answerCount === 1 ? "answer" : "answers"}
            />
            <StatPill
              value={question.tipTotal ?? 0}
              label="DVT"
              variant="primary"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

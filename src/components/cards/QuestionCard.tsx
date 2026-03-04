import Link from "next/link";
import type { LiveQuestion } from "@/lib/live-types";
import { Tag, Timestamp, StatPill, Avatar } from "@/components/ui/primitives";
import { MarkdownExcerpt } from "@/components/ui/MarkdownExcerpt";

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
          {question.bountyAmount > 0 && (
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
        <MarkdownExcerpt
          content={question.shortDescription || "No description provided."}
          className="mb-3"
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {question.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-main/40 pt-4 mt-1">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              accountId={question.author.accountId}
              displayName={question.author.displayName}
              size={28}
            />
            <div className="flex items-center h-full">
              <span className="text-border-main/50 self-stretch border-l border-border-main mx-1 ml-2" />
              <Timestamp iso={question.consensusTimestamp} />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <StatPill
              value={question.answerCount ?? 0}
              label={question.answerCount === 1 ? "answer" : "answers"}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <polyline points="9 10 12 13 16 8" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

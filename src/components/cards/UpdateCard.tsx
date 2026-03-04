import Link from "next/link";
import type { LiveUpdate } from "@/lib/live-types";
import { Tag, Timestamp, StatPill, Avatar } from "@/components/ui/primitives";
import { MarkdownExcerpt } from "@/components/ui/MarkdownExcerpt";

interface UpdateCardProps {
  update: LiveUpdate;
}

export function UpdateCard({ update }: UpdateCardProps) {
  return (
    <Link
      href={`/updates/${update.sequenceNumber}`}
      className="block rounded-lg border bg-bg-panel border-border-main hover:border-primary-600 transition-colors duration-150"
    >
      <div className="px-5 py-4">
        {/* Title */}
        <h3 className="text-[15px] font-medium leading-snug mb-2 text-text-main">
          {update.title}
        </h3>

        {/* Excerpt */}
        <MarkdownExcerpt
          content={update.shortDescription || "No description provided."}
          className="mb-3"
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {update.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-main/40 pt-4 mt-1">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              accountId={update.author.accountId}
              displayName={update.author.displayName}
              size={28}
            />
            <div className="flex items-center h-full">
              <span className="text-border-main/50 self-stretch border-l border-border-main mx-1 ml-2" />
              <Timestamp iso={update.consensusTimestamp} />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <StatPill
              value={update.commentCount ?? 0}
              label={update.commentCount === 1 ? "comment" : "comments"}
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
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

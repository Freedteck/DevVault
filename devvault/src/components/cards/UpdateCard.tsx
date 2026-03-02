import Link from "next/link";
import type { LiveUpdate } from "@/lib/live-types";
import { Tag, Timestamp, StatPill } from "@/components/ui/primitives";

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
        <p className="text-sm leading-relaxed mb-3 line-clamp-2 text-text-secondary">
          {update.shortDescription || "No description provided."}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {update.tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 bg-primary-800 text-primary-300">
              {update.author.displayName.charAt(0).toUpperCase()}
            </span>
            <span className="text-[12px] text-text-muted">
              {update.author.displayName}
            </span>
            <span className="text-border-main">·</span>
            <Timestamp iso={update.consensusTimestamp} />
          </div>

          <div className="flex items-center gap-3">
            <StatPill value={update.commentCount ?? 0} label="comments" />
            <StatPill
              value={update.tipTotal ?? 0}
              label="DVT"
              variant="primary"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

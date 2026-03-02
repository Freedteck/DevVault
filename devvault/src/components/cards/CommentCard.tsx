import type { LiveComment } from "@/lib/live-types";
import { Timestamp, StatPill } from "@/components/ui/primitives";

interface CommentCardProps {
  comment: LiveComment;
}

export function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="rounded-lg border bg-bg-panel border-border-main p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 bg-primary-800 text-primary-300">
            {comment.author.displayName.charAt(0).toUpperCase()}
          </span>
          <span className="text-xs font-medium text-text-main">
            {comment.author.displayName}
          </span>
          <span className="text-border-main">·</span>
          <Timestamp iso={comment.consensusTimestamp} />
        </div>
        <StatPill value={comment.tipTotal ?? 0} label="DVT" variant="primary" />
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">
        {comment.body}
      </p>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border-main/50">
        <button className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
          Tip
        </button>
        <button className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
          Reply
        </button>
      </div>
    </div>
  );
}


import type { LiveComment } from "@/lib/live-types";
import { Avatar, Timestamp } from "@/components/ui/primitives";
import { MarkdownBody } from "@/components/ui/MarkdownBody";

interface CommentCardProps {
  comment: LiveComment;
}

export function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="rounded-lg border bg-bg-panel border-border-main p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            accountId={comment.author.accountId}
            displayName={comment.author.displayName}
            size={24}
          />
          <div className="flex items-center h-full">
            <span className="text-border-main/50 self-stretch border-l border-border-main mx-1 ml-2" />
            <Timestamp iso={comment.consensusTimestamp} />
          </div>
        </div>
      </div>
      <MarkdownBody content={comment.body} className="text-sm" />
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicMessage, getTopicMessages } from "@/lib/hedera-mirror";
import type {
  HCSAnnouncementPayload,
  HCSCommentPayload,
} from "@/lib/hcs-types";
import type { LiveComment } from "@/lib/live-types";
import { Tag, Timestamp, StatPill } from "@/components/ui/primitives";
import { CommentCard } from "@/components/cards/CommentCard";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { Metadata } from "next";
import { CommentForm } from "@/components/forms/CommentForm";

export const revalidate = 3600; // Cache for 1 hour, manually revalidated on activity

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const seqNum = parseInt(id);
  if (isNaN(seqNum)) return { title: "Announcement Not Found" };
  const topicId = process.env.NEXT_PUBLIC_ANNOUNCEMENTS_TOPIC_ID!;
  try {
    const msg = await getTopicMessage<HCSAnnouncementPayload>(topicId, seqNum);
    return { title: `${msg.data?.title || "Announcement"} | DevVault` };
  } catch {
    return { title: "DevVault Announcement" };
  }
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { id } = await params;
  const sequenceNumber = parseInt(id);
  if (isNaN(sequenceNumber)) notFound();

  const announcementsTopicId = process.env.NEXT_PUBLIC_ANNOUNCEMENTS_TOPIC_ID!;

  try {
    const msg = await getTopicMessage<HCSAnnouncementPayload>(
      announcementsTopicId,
      sequenceNumber,
    );

    if (msg.data?.type !== "ANNOUNCEMENT") return notFound();

    const body = msg.data.body || "";

    // Fetch comments from discussion topic if available
    let comments: LiveComment[] = [];
    if (msg.data.discussionTopicId) {
      try {
        const commentMessages = await getTopicMessages<HCSCommentPayload>(
          msg.data.discussionTopicId,
          100,
        );
        comments = commentMessages
          .filter((m) => m.data?.type === "COMMENT")
          .map((m) => ({
            sequenceNumber: m.sequenceNumber,
            consensusTimestamp: m.consensusTimestamp,
            body: m.data!.body,
            author: m.data!.author,
          }))
          .reverse();
      } catch {
        // No comments yet
      }
    }

    return (
      <div className="max-w-5xl space-y-8 pb-12">
        {/* Breadcrumbs */}
        <Link
          href="/updates"
          className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-primary-500 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Updates
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-text-main leading-tight">
            {msg.data.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-main pb-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 bg-primary-800 text-primary-300">
                {msg.data.author.displayName.charAt(0).toUpperCase()}
              </span>
              <span className="text-xs font-medium text-text-main">
                {msg.data.author.displayName}
              </span>
            </div>
            <span className="text-border-main">|</span>
            <Timestamp iso={msg.consensusTimestamp} />
            <span className="text-border-main">|</span>
            <StatPill
              value={sequenceNumber}
              label="Announcement #"
              variant="primary"
            />
          </div>
        </div>

        {/* Body */}
        <MarkdownBody content={body} />

        {/* Call to Action Link (Subtle) */}
        {msg.data.link && (
          <div className="pt-2">
            <a
              href={msg.data.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-primary-500 hover:text-primary-400 transition-colors uppercase tracking-widest inline-flex items-center gap-2"
            >
              {msg.data.linkText || "Details"}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}

        {/* Comments Section */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-border-main pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
              {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
            </h2>
          </div>

          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard key={comment.sequenceNumber} comment={comment} />
            ))}
          </div>
        </section>

        {/* Post a Comment */}
        <section className="space-y-4 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
            Join the Discussion
          </h3>
          {msg.data.discussionTopicId ? (
            <CommentForm
              discussionTopicId={msg.data.discussionTopicId}
              placeholder="Share your thoughts on this announcement..."
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border-main p-8 text-center bg-bg-panel/50">
              <p className="text-sm text-text-muted">
                Discussion topic not available for this announcement.
              </p>
            </div>
          )}
        </section>
      </div>
    );
  } catch (err) {
    console.error("Failed to load announcement details:", err);
    return notFound();
  }
}

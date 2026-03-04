import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicMessage, getTopicMessages } from "@/lib/hedera-mirror";
import { fetchFromIPFS } from "@/lib/ipfs";
import type { HCSUpdatePayload, HCSCommentPayload } from "@/lib/hcs-types";
import type { LiveComment } from "@/lib/live-types";
import { Tag, Timestamp } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/primitives";
import { CommentCard } from "@/components/cards/CommentCard";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { CommentForm } from "@/components/forms/CommentForm";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour, manually revalidated on activity

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const seqNum = parseInt(id);
  if (isNaN(seqNum)) return { title: "Update Not Found" };
  const topicId = process.env.NEXT_PUBLIC_UPDATES_TOPIC_ID!;
  try {
    const msg = await getTopicMessage<HCSUpdatePayload>(topicId, seqNum);
    return { title: `${msg.data?.title || "Update"} | Vurso` };
  } catch {
    return { title: "Vurso Update" };
  }
}

export default async function UpdateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const sequenceNumber = parseInt(id);
  if (isNaN(sequenceNumber)) notFound();

  const updatesTopicId = process.env.NEXT_PUBLIC_UPDATES_TOPIC_ID!;

  try {
    const msg = await getTopicMessage<HCSUpdatePayload>(
      updatesTopicId,
      sequenceNumber,
    );
    if (msg.data?.type !== "UPDATE") return notFound();

    // Resolve body: IPFS if bodyCid is set, else inline HCS body
    const rawBodyCid = msg.data.bodyCid as string | undefined;
    const body = rawBodyCid
      ? ((await fetchFromIPFS(rawBodyCid)) ?? msg.data.body)
      : msg.data.body;

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
        // No comments yet — fine
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

        {/* Update Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-text-main leading-tight">
            {msg.data.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-main pb-4">
            <div className="flex items-center gap-2">
              <Avatar
                accountId={msg.data.author.accountId}
                displayName={msg.data.author.displayName}
                size={24}
              />
            </div>
            <span className="text-border-main">|</span>
            <Timestamp iso={msg.consensusTimestamp} />
          </div>
        </div>

        {/* Body */}
        <MarkdownBody content={body ?? ""} />

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {(msg.data.tags || []).map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>

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
              placeholder="Share your thoughts on this update..."
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border-main p-8 text-center bg-bg-panel/50">
              <p className="text-sm text-text-muted">
                Discussion topic not available for this update.
              </p>
            </div>
          )}
        </section>
      </div>
    );
  } catch (err) {
    console.error("Failed to load update details:", err);
    return notFound();
  }
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicMessage, getTopicMessages } from "@/lib/hedera-mirror";
import { fetchFromIPFS } from "@/lib/ipfs";
import type { HCSUpdatePayload, HCSCommentPayload } from "@/lib/hcs-types";
import type { LiveComment } from "@/lib/live-types";
import { Tag, Timestamp, StatPill } from "@/components/ui/primitives";
import { CommentCard } from "@/components/cards/CommentCard";
import { Metadata } from "next";

export const revalidate = 10;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const seqNum = parseInt(id);
  if (isNaN(seqNum)) return { title: "Update Not Found" };
  const topicId = process.env.NEXT_PUBLIC_UPDATES_TOPIC_ID!;
  try {
    const msg = await getTopicMessage<HCSUpdatePayload>(topicId, seqNum);
    return { title: `${msg.data?.title || "Update"} | DevVault` };
  } catch {
    return { title: "DevVault Update" };
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
      ? (await fetchFromIPFS(rawBodyCid)) ?? msg.data.body
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
            tipTotal: 0,
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

          <div className="flex items-center gap-4 border-b border-border-main pb-4">
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
            <StatPill value={0} label="DVT Tipped" variant="primary" />
          </div>
        </div>

        {/* Body */}
        <div className="text-[15px] leading-relaxed text-text-secondary whitespace-pre-wrap font-sans">
          {body}
        </div>

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
          <div className="rounded-lg border border-border-main bg-bg-panel p-4">
            <textarea
              placeholder="Share your thoughts on this update..."
              className="w-full h-24 bg-transparent border-none outline-none text-sm text-text-primary resize-none font-sans"
            />
            <div className="flex items-center justify-end mt-4 border-t border-border-main pt-4">
              <button className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors">
                Post Comment
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  } catch (err) {
    console.error("Failed to load update details:", err);
    return notFound();
  }
}

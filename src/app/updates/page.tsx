import { getTopicMessagesPaged, getTopicInfo } from "@/lib/hedera-mirror";
import type { HCSUpdatePayload } from "@/lib/hcs-types";
import type { LiveUpdate } from "@/lib/live-types";
import { UpdateCard } from "@/components/cards/UpdateCard";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates | Vurso",
  description:
    "Stay updated with the latest Hedera ecosystem news and developer insights.",
};

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function UpdatesPage({ searchParams }: PageProps) {
  const { cursor } = await searchParams;
  const topicId = process.env.NEXT_PUBLIC_UPDATES_TOPIC_ID!;
  let liveUpdates: LiveUpdate[] = [];
  let nextCursor: string | null = null;

  try {
    const { messages, nextCursor: nc } =
      await getTopicMessagesPaged<HCSUpdatePayload>(topicId, 20, cursor);
    nextCursor = nc;

    liveUpdates = messages
      .filter((msg) => msg.data?.type === "UPDATE")
      .map((msg) => ({
        sequenceNumber: msg.sequenceNumber,
        consensusTimestamp: msg.consensusTimestamp,
        title: msg.data!.title,
        shortDescription:
          msg.data!.shortDescription || msg.data!.body?.slice(0, 160) || "",
        tags: msg.data!.tags || [],
        author: msg.data!.author,
        discussionTopicId: msg.data!.discussionTopicId,
        commentCount: 0,
      }));
    // Already newest-first from Mirror Node (order=desc)

    // Batch-fetch comment counts from each update's discussion topic
    const updateTopicInfos = await Promise.allSettled(
      liveUpdates.map((u) =>
        u.discussionTopicId
          ? getTopicInfo(u.discussionTopicId)
          : Promise.resolve({ sequenceNumber: 0 }),
      ),
    );

    console.log("Debug - Updates:", {
      count: liveUpdates.length,
      firstUpdate: liveUpdates[0],
      topicInfosFirst: updateTopicInfos[0],
    });

    liveUpdates = liveUpdates.map((u, i) => ({
      ...u,
      commentCount:
        updateTopicInfos[i].status === "fulfilled"
          ? updateTopicInfos[i].value.sequenceNumber
          : 0,
    }));
  } catch (error) {
    console.error("Failed to fetch live updates", error);
  }

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-main mb-2">
            Community Updates
          </h1>
          <p className="text-sm text-text-secondary">
            Framework news, ecosystem releases, and technical deep-dives from
            the Hedera community.
          </p>
        </div>
        <Link
          href="/updates/new"
          className="self-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-primary-600 hover:bg-primary-700 text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Post Update
        </Link>
      </div>

      {/* Featured / Announcement Bar (Mock) */}
      <div className="rounded-lg border border-primary-600/20 bg-primary-950/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-[10px] shrink-0">
            📢
          </span>
          <p className="text-sm text-primary-200">
            Hedera Apex 2026 Hackathon is officially live! Submit your project
            by March 15th.
          </p>
        </div>
        <button className="self-start sm:self-auto text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest shrink-0">
          Details
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {liveUpdates.length > 0 ? (
          liveUpdates.map((u) => (
            <UpdateCard key={u.sequenceNumber} update={u} />
          ))
        ) : (
          <div className="text-center py-12 text-text-muted">
            <p>No community updates found on the network yet.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {(cursor || nextCursor) && (
        <div className="flex items-center justify-between pt-6 border-t border-border-main">
          {cursor ? (
            <Link
              href="/updates"
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border-main bg-bg-panel hover:bg-bg-subtle transition-colors text-text-secondary"
            >
              ← Latest
            </Link>
          ) : (
            <span />
          )}
          {nextCursor ? (
            <Link
              href={`/updates?cursor=${encodeURIComponent(nextCursor)}`}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border-main bg-bg-panel hover:bg-bg-subtle transition-colors text-text-secondary"
            >
              Older updates →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

import {
  getTopicMessagesPaged,
  getTopicInfo,
  getTopicMessages,
} from "@/lib/hedera-mirror";
import type { HCSUpdatePayload, HCSAnnouncementPayload } from "@/lib/hcs-types";
import type { LiveUpdate } from "@/lib/live-types";
import { UpdateCard } from "@/components/cards/UpdateCard";
import { AnnouncementCarousel } from "@/components/announcements/AnnouncementCarousel";
import { ParsedHCSMessage } from "@/lib/hedera-mirror";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates | DevVault",
  description:
    "Stay updated with the latest Hedera ecosystem news and developer insights.",
};

export const revalidate = 3600; // Cache for 1 hour, manually revalidated on post

interface PageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function UpdatesPage({ searchParams }: PageProps) {
  const { cursor } = await searchParams;
  const topicId = process.env.NEXT_PUBLIC_UPDATES_TOPIC_ID!;
  let liveUpdates: LiveUpdate[] = [];
  let nextCursor: string | null = null;
  let announcements: ParsedHCSMessage<HCSAnnouncementPayload>[] = [];

  try {
    const { messages, nextCursor: nc } =
      await getTopicMessagesPaged<HCSUpdatePayload>(
        topicId,
        20,
        cursor,
        true, // withAnswerCount = true
      );
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
        commentCount: msg.answerCount ?? 0,
      }));

    // Fetch latest announcements from the dedicated topic
    const announcementsTopicId = process.env.NEXT_PUBLIC_ANNOUNCEMENTS_TOPIC_ID;
    if (announcementsTopicId) {
      try {
        const annMsgs = await getTopicMessages<HCSAnnouncementPayload>(
          announcementsTopicId,
          5,
        );
        // Filter for proper announcement type
        announcements = annMsgs.filter((a) => a.data?.type === "ANNOUNCEMENT");
      } catch (err) {
        console.error("Failed to fetch announcements", err);
      }
    }
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

      {/* Featured Announcements (Carousel) */}
      {announcements.length > 0 && (
        <AnnouncementCarousel announcements={announcements} />
      )}

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

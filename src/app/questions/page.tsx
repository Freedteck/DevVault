import { getTopicMessagesPaged } from "@/lib/hedera-mirror";
import type { HCSQuestionPayload } from "@/lib/hcs-types";
import type { LiveQuestion } from "@/lib/live-types";
import { QuestionCard } from "@/components/cards/QuestionCard";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Questions | Vurso",
  description: "Browse the latest developer questions on Vurso.",
};

export const revalidate = 3600; // Cache for 1 hour, manually revalidated on post

interface PageProps {
  searchParams: Promise<{ cursor?: string; tab?: string }>;
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const { cursor, tab = "latest" } = await searchParams;
  const topicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
  let liveQuestions: LiveQuestion[] = [];
  let nextCursor: string | null = null;

  try {
    // Increase limit to 50 when filtering/sorting, but only show first few
    // In a production app, we'd ideally have an indexer for complex sorting/filtering.
    const limit = tab === "latest" ? 10 : 50;

    const { messages, nextCursor: nc } =
      await getTopicMessagesPaged<HCSQuestionPayload>(
        topicId,
        limit,
        cursor,
        true,
      );
    nextCursor = nc;

    liveQuestions = messages
      .filter((msg) => msg.data?.type === "QUESTION")
      .map((msg) => ({
        sequenceNumber: msg.sequenceNumber,
        consensusTimestamp: msg.consensusTimestamp,
        title: msg.data!.title,
        shortDescription:
          msg.data!.shortDescription || msg.data!.body?.slice(0, 160) || "",
        tags: msg.data!.tags || [],
        author: msg.data!.author,
        bountyAmount: msg.data!.bountyAmount || 0,
        bountyCurrency: msg.data!.bountyCurrency || "VRS",
        discussionTopicId: msg.data!.discussionTopicId,
        answerCount: msg.answerCount ?? 0,
        accepted: false,
        tipTotal: 0,
      }));

    // Server-side filtering/sorting based on the batch we just fetched
    if (tab === "bounties") {
      liveQuestions.sort((a, b) => b.bountyAmount - a.bountyAmount);
    } else if (tab === "unanswered") {
      liveQuestions = liveQuestions.filter((q) => q.answerCount === 0);
    }
  } catch (error) {
    console.error("Failed to fetch live questions", error);
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2 text-text-main">
            Debugger&apos;s Den
          </h1>
          <p className="text-sm text-text-secondary">
            Technical questions backed by on-chain bounties and reputation.
          </p>
        </div>
        <Link
          href="/questions/new"
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
          Ask Question
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b pb-4 border-border-main">
        <TabLink active={tab === "latest"} href="/questions?tab=latest">
          Latest
        </TabLink>
        <TabLink active={tab === "bounties"} href="/questions?tab=bounties">
          Top Bounties
        </TabLink>
        <TabLink active={tab === "unanswered"} href="/questions?tab=unanswered">
          Unanswered
        </TabLink>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {liveQuestions.length > 0 ? (
          liveQuestions.map((q) => (
            <QuestionCard key={q.sequenceNumber} question={q} />
          ))
        ) : (
          <div className="text-center py-12 text-text-muted">
            <p>No questions found for this view.</p>
          </div>
        )}
      </div>

      {/* Pagination (Only show on Latest for simplicity in this serverless batch approach) */}
      {tab === "latest" && (cursor || nextCursor) && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-main">
          {cursor ? (
            <Link
              href="/questions"
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border-main bg-bg-panel hover:bg-bg-subtle transition-colors text-text-secondary"
            >
              ← Latest
            </Link>
          ) : (
            <span />
          )}
          {nextCursor ? (
            <Link
              href={`/questions?cursor=${encodeURIComponent(nextCursor)}`}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border-main bg-bg-panel hover:bg-bg-subtle transition-colors text-text-secondary"
            >
              Older questions →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        active ? "text-text-main" : "text-text-muted hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

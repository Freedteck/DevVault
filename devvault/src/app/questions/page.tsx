import { getTopicMessages, getTopicInfo } from "@/lib/hedera-mirror";
import type { HCSQuestionPayload } from "@/lib/hcs-types";
import type { LiveQuestion } from "@/lib/live-types";
import { QuestionCard } from "@/components/cards/QuestionCard";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Questions | DevVault",
  description: "Browse the latest developer questions on DevVault.",
};

export const revalidate = 10;

export default async function QuestionsPage() {
  const topicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
  let liveQuestions: LiveQuestion[] = [];

  try {
    const messages = await getTopicMessages<HCSQuestionPayload>(topicId);
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
        bountyCurrency: msg.data!.bountyCurrency || "DVT",
        discussionTopicId: msg.data!.discussionTopicId,
        answerCount: 0,
        accepted: false,
        tipTotal: 0,
      }))
      .reverse();

    // Batch-fetch answer counts from each question's discussion topic
    const topicInfos = await Promise.allSettled(
      liveQuestions.map((q) =>
        q.discussionTopicId
          ? getTopicInfo(q.discussionTopicId)
          : Promise.resolve({ sequenceNumber: 0 })
      )
    );
    liveQuestions = liveQuestions.map((q, i) => ({
      ...q,
      answerCount:
        topicInfos[i].status === "fulfilled"
          ? topicInfos[i].value.sequenceNumber
          : 0,
    }));
  } catch (error) {
    console.error("Failed to fetch live questions", error);
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2 text-text-main">
            Debugger's Den
          </h1>
          <p className="text-sm text-text-secondary">
            Technical questions backed by on-chain bounties and reputation.
          </p>
        </div>
        <Link
          href="/questions/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-primary-600 hover:bg-primary-700 text-white"
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

      {/* Filters (Mock) */}
      <div className="flex items-center gap-4 mb-6 border-b pb-4 border-border-main">
        <button className="text-sm font-medium transition-colors text-text-main">
          Latest
        </button>
        <button className="text-sm font-medium transition-colors hover:text-white text-text-muted">
          Top Bounties
        </button>
        <button className="text-sm font-medium transition-colors hover:text-white text-text-muted">
          Unanswered
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {liveQuestions.length > 0 ? (
          liveQuestions.map((q) => (
            <QuestionCard key={q.sequenceNumber} question={q} />
          ))
        ) : (
          <div className="text-center py-12 text-text-muted">
            <p>No questions found on the network yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

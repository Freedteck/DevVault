import Link from "next/link";
import { QuestionCard } from "@/components/cards/QuestionCard";
import { UpdateCard } from "@/components/cards/UpdateCard";
import { formatNumber } from "@/lib/utils";
import { getTopicMessagesPaged, getTopicInfo } from "@/lib/hedera-mirror";
import type { HCSQuestionPayload, HCSUpdatePayload } from "@/lib/hcs-types";
import type { LiveQuestion, LiveUpdate } from "@/lib/live-types";

const MIRROR_NODE_BASE =
  process.env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
    ? "https://mainnet.mirrornode.hedera.com/api/v1"
    : "https://testnet.mirrornode.hedera.com/api/v1";

async function getDVTCirculatingSupply(tokenId: string): Promise<number> {
  try {
    const res = await fetch(`${MIRROR_NODE_BASE}/tokens/${tokenId}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return 0;
    const j = await res.json();
    return Math.floor(Number(j.total_supply ?? 0) / 100);
  } catch {
    return 0;
  }
}

export const revalidate = 10;

export default async function HomePage() {
  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
  const updatesTopicId = process.env.NEXT_PUBLIC_UPDATES_TOPIC_ID!;
  const dvtTokenId = process.env.NEXT_PUBLIC_DVT_TOKEN_ID!;

  let recentQuestions: LiveQuestion[] = [];
  let recentUpdates: LiveUpdate[] = [];
  let totalQuestions = 0;
  let totalUpdates = 0;
  let totalContributors = 0;
  let dvtCirculating = 0;

  try {
    const [qInfo, uInfo, qPage, uPage, dvtSupply] = await Promise.all([
      getTopicInfo(questionsTopicId),
      getTopicInfo(updatesTopicId),
      getTopicMessagesPaged<HCSQuestionPayload>(
        questionsTopicId,
        50,
        undefined,
        true,
      ),
      getTopicMessagesPaged<HCSUpdatePayload>(
        updatesTopicId,
        5,
        undefined,
        true,
      ),
      getDVTCirculatingSupply(dvtTokenId),
    ]);

    totalQuestions = qInfo.sequenceNumber;
    totalUpdates = uInfo.sequenceNumber;
    dvtCirculating = dvtSupply;

    // Count unique contributors from all question authors
    const authorSet = new Set<string>();
    for (const msg of qPage.messages) {
      if (msg.data?.author?.accountId) {
        authorSet.add(msg.data.author.accountId);
      }
    }
    totalContributors = authorSet.size;

    recentQuestions = qPage.messages
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
        answerCount: msg.answerCount ?? 0,
        accepted: false,
        tipTotal: 0,
      }))
      .slice(0, 3);

    recentUpdates = uPage.messages
      .filter((msg) => msg.data?.type === "UPDATE")
      .map((msg) => ({
        sequenceNumber: msg.sequenceNumber,
        consensusTimestamp: msg.consensusTimestamp,
        title: msg.data!.title,
        shortDescription:
          msg.data!.shortDescription || msg.data!.body?.slice(0, 160) || "",
        tags: msg.data!.tags || [],
        author: msg.data!.author,
        commentCount: msg.answerCount ?? 0,
        tipTotal: 0,
      }))
      .slice(0, 2);
  } catch (error) {
    console.error("Failed to fetch live home feed", error);
  }

  const STAT_BLOCKS = [
    {
      label: "Questions",
      value: totalQuestions,
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      ),
    },
    {
      label: "Updates",
      value: totalUpdates,
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 11a9 9 0 0 1 9 9" />
          <path d="M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1" />
        </svg>
      ),
    },
    {
      label: "Contributors",
      value: totalContributors,
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      label: "DVT Circulating",
      value: formatNumber(dvtCirculating),
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      highlight: true,
    },
  ];

  return (
    <div className="max-w-5xl flex flex-col gap-8">
      {/* Hero Row */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          The Den
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          A decentralised knowledge network for developers, on Hedera.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_BLOCKS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border px-4 py-3"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: stat.highlight
                ? "var(--color-primary-800)"
                : "var(--border)",
            }}
          >
            <div
              className="flex items-center gap-2 mb-1.5"
              style={{
                color: stat.highlight
                  ? "var(--color-primary-500)"
                  : "var(--text-muted)",
              }}
            >
              {stat.icon}
              <span className="text-[11px] uppercase tracking-widest font-medium">
                {stat.label}
              </span>
            </div>
            <p
              className="font-mono text-xl font-bold"
              style={{
                color: stat.highlight
                  ? "var(--color-primary-400)"
                  : "var(--text-primary)",
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Questions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Recent Questions
          </h2>
          <Link
            href="/questions"
            className="text-xs font-medium transition-colors"
            style={{ color: "var(--color-primary-500)" }}
          >
            View all →
          </Link>
        </div>
        <div className="space-y-2.5">
          {recentQuestions.length > 0 ? (
            recentQuestions.map((q) => (
              <QuestionCard key={q.sequenceNumber} question={q} />
            ))
          ) : (
            <div
              className="text-center py-4 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              No recent questions found.
            </div>
          )}
        </div>
      </section>

      {/* Recent Updates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Recent Updates
          </h2>
          <Link
            href="/updates"
            className="text-xs font-medium transition-colors"
            style={{ color: "var(--color-primary-500)" }}
          >
            View all →
          </Link>
        </div>
        <div className="space-y-2.5">
          {recentUpdates.length > 0 ? (
            recentUpdates.map((u) => (
              <UpdateCard key={u.sequenceNumber} update={u} />
            ))
          ) : (
            <div
              className="text-center py-4 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              No recent updates found.
            </div>
          )}
        </div>
      </section>

      {/* Hedera Network Note */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg border text-sm"
        style={{
          backgroundColor: "var(--bg-panel)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: "var(--color-primary-500)" }}
        />
        <span>
          Connected to{" "}
          <span
            className="font-mono text-[12px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Hedera Testnet
          </span>{" "}
          · All content stored on HCS · Identities via HCS-11
        </span>
      </div>
    </div>
  );
}

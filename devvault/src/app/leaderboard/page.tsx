import {
  getTokenTopHolders,
  getTopicMessages,
} from "@/lib/hedera-mirror";
import type { HCSQuestionPayload, HCSAcceptPayload } from "@/lib/hcs-types";
import { AuthorBadge } from "@/components/ui/primitives";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | DevVault",
  description: "Top contributors in the DevVault ecosystem.",
};

// Revalidate every 2 minutes — leaderboard is expensive to compute
export const revalidate = 120;

interface LeaderboardEntry {
  rank: number;
  accountId: string;
  displayName: string;
  dvtBalance: number; // whole DVT units (2 decimals: balance / 100)
  acceptedAnswers: number;
  questionsAsked: number;
  score: number; // dvtBalance + acceptedAnswers * 10
}

export default async function LeaderboardPage() {
  const tokenId = process.env.NEXT_PUBLIC_DVT_TOKEN_ID!;
  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
  let leaderboard: LeaderboardEntry[] = [];

  try {
    // 1. Top 25 DVT holders from Mirror Node token balances
    const holders = await getTokenTopHolders(tokenId, 25);

    // 2. All questions to count per-author stats and find discussion topic IDs
    const questionMessages = await getTopicMessages<HCSQuestionPayload>(
      questionsTopicId,
      500,
    );
    const questions = questionMessages.filter(
      (m) => m.data?.type === "QUESTION",
    );

    // Count questions asked per account
    const questionsAskedMap = new Map<string, number>();
    // Collect displayNames from question authors
    const displayNameMap = new Map<string, string>();
    for (const q of questions) {
      const author = q.data!.author;
      questionsAskedMap.set(
        author.accountId,
        (questionsAskedMap.get(author.accountId) ?? 0) + 1,
      );
      if (!displayNameMap.has(author.accountId)) {
        displayNameMap.set(author.accountId, author.displayName);
      }
    }

    // 3. Fetch all discussion topics in parallel to count accepted answers
    const discussionTopicIds = questions
      .map((q) => q.data!.discussionTopicId)
      .filter(Boolean) as string[];

    const uniqueTopics = [...new Set(discussionTopicIds)];
    const acceptedAnswersMap = new Map<string, number>();

    const topicResults = await Promise.allSettled(
      uniqueTopics.map((topicId) =>
        getTopicMessages<HCSAcceptPayload>(topicId, 20),
      ),
    );

    for (const result of topicResults) {
      if (result.status !== "fulfilled") continue;
      for (const msg of result.value) {
        if (msg.data?.type !== "ACCEPT") continue;
        const answerer = (msg.data as HCSAcceptPayload).answererAccountId;
        if (answerer) {
          acceptedAnswersMap.set(
            answerer,
            (acceptedAnswersMap.get(answerer) ?? 0) + 1,
          );
        }
      }
    }

    // 4. Build leaderboard from DVT holders, enriched with activity counts
    leaderboard = holders
      .filter((h) => h.balance > 0)
      .map((h, idx) => {
        const dvt = h.balance / 100; // 2 decimals
        const accepted = acceptedAnswersMap.get(h.accountId) ?? 0;
        const asked = questionsAskedMap.get(h.accountId) ?? 0;
        return {
          rank: idx + 1,
          accountId: h.accountId,
          displayName:
            displayNameMap.get(h.accountId) ?? h.accountId.slice(0, 12),
          dvtBalance: dvt,
          acceptedAnswers: accepted,
          questionsAsked: asked,
          score: Math.round(dvt + accepted * 10),
        };
      })
      // Re-sort by composite score after enrichment
      .sort((a, b) => b.score - a.score)
      .map((e, idx) => ({ ...e, rank: idx + 1 }));
  } catch (err) {
    console.error("Failed to build leaderboard", err);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <h1 className="text-3xl font-bold tracking-tight text-text-main">
          The High Vault
        </h1>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Recognizing the developers who have built the most value in the Hedera
          ecosystem. Ranked by DVT earned and solutions accepted.
        </p>
      </div>

      {/* Top 3 Podiums */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((entry, idx) => {
          const colors = [
            "border-accent-500 bg-accent-500/5",
            "border-slate-400 bg-slate-400/5",
            "border-amber-700 bg-amber-700/5",
          ];
          const labels = ["1st", "2nd", "3rd"];
          return (
            <div
              key={entry.accountId}
              className={`rounded-xl border p-6 flex flex-col items-center text-center space-y-3 ${colors[idx]}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {labels[idx]} Place
              </span>
              <div className="w-16 h-16 rounded-2xl bg-primary-800 text-primary-200 flex items-center justify-center text-2xl font-bold shadow-xl shadow-primary-900/40">
                {entry.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-text-main">{entry.displayName}</h3>
                <p className="text-[11px] font-mono text-text-muted">
                  {entry.accountId}
                </p>
              </div>
              <div className="pt-2">
                <p className="text-lg font-mono font-bold text-primary-400">
                  {entry.score.toLocaleString()}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">
                  Reputation
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <p>No DVT holders found on-chain yet. Be the first to earn DVT!</p>
        </div>
      )}

      {/* Full List */}
      {leaderboard.length > 0 && (
        <div className="rounded-lg border border-border-main bg-bg-panel overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg-subtle border-b border-border-main">
              <tr>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Rank
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                  Developer
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-text-muted text-center">
                  Solutions
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-text-muted text-center">
                  Questions
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-text-muted text-right">
                  DVT Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {leaderboard.map((entry) => (
                <tr
                  key={entry.accountId}
                  className="hover:bg-bg-subtle/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-sm text-text-muted">
                    #{entry.rank}
                  </td>
                  <td className="px-6 py-4">
                    <AuthorBadge
                      accountId={entry.accountId}
                      displayName={entry.displayName}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm text-primary-500 font-medium">
                    {entry.acceptedAnswers}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm text-text-secondary">
                    {entry.questionsAsked}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm font-bold text-text-main">
                      {entry.dvtBalance.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="ml-1 text-[10px] text-text-muted">DVT</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

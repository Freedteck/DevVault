import { getTopicMessages } from "@/lib/hedera-mirror";
import type { HCSQuestionPayload, HCSAcceptPayload } from "@/lib/hcs-types";
import { AuthorBadge, Avatar } from "@/components/ui/primitives";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | Vurso",
  description: "Top contributors in the Vurso ecosystem.",
};

// Revalidate every 2 minutes — leaderboard is expensive to compute
export const revalidate = 120;

interface LeaderboardEntry {
  rank: number;
  accountId: string;
  displayName: string;
  /** Total VRS received as bounty payouts — never decreases when VRS is spent */
  vrsEarned: number;
  acceptedAnswers: number;
  questionsAsked: number;
}

export default async function LeaderboardPage() {
  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;
  let leaderboard: LeaderboardEntry[] = [];

  try {
    // 1. All questions — source of bounty amounts and discussion topic IDs
    const questionMessages = await getTopicMessages<HCSQuestionPayload>(
      questionsTopicId,
      500,
    );
    const questions = questionMessages.filter(
      (m) => m.data?.type === "QUESTION",
    );

    // questions asked per account + display names
    const questionsAskedMap = new Map<string, number>();
    const displayNameMap = new Map<string, string>();

    // discussion topic → bounty info (for VRS earned lookup)
    const topicBountyMap = new Map<
      string,
      { amount: number; currency: string }
    >();

    for (const q of questions) {
      const d = q.data!;
      const author = d.author;
      questionsAskedMap.set(
        author.accountId,
        (questionsAskedMap.get(author.accountId) ?? 0) + 1,
      );
      if (!displayNameMap.has(author.accountId)) {
        displayNameMap.set(author.accountId, author.displayName);
      }
      if (d.discussionTopicId) {
        topicBountyMap.set(d.discussionTopicId, {
          amount: d.bountyAmount ?? 0,
          currency: d.bountyCurrency ?? "",
        });
      }
    }

    // 2. Fetch all discussion topics in parallel — find ACCEPT messages
    const uniqueTopics = [...topicBountyMap.keys()];
    const acceptedAnswersMap = new Map<string, number>();
    const vrsEarnedMap = new Map<string, number>();

    const topicResults = await Promise.allSettled(
      uniqueTopics.map((topicId) =>
        getTopicMessages<HCSAcceptPayload>(topicId, 20),
      ),
    );

    uniqueTopics.forEach((topicId, i) => {
      const result = topicResults[i];
      if (result.status !== "fulfilled") return;
      for (const msg of result.value) {
        if (msg.data?.type !== "ACCEPT") continue;
        const answerer = (msg.data as HCSAcceptPayload).answererAccountId;
        if (!answerer) continue;

        // tally accepted answer count
        acceptedAnswersMap.set(
          answerer,
          (acceptedAnswersMap.get(answerer) ?? 0) + 1,
        );

        // tally VRS earned only from VRS-denominated bounties
        const bounty = topicBountyMap.get(topicId);
        if (bounty && bounty.currency === "VRS" && bounty.amount > 0) {
          vrsEarnedMap.set(
            answerer,
            (vrsEarnedMap.get(answerer) ?? 0) + bounty.amount,
          );
        }
      }
    });

    // 3. Union all accounts that appear in either map
    const allAccounts = new Set([
      ...questionsAskedMap.keys(),
      ...acceptedAnswersMap.keys(),
    ]);

    leaderboard = [...allAccounts]
      .map((accountId) => ({
        rank: 0,
        accountId,
        displayName: displayNameMap.get(accountId) ?? accountId.slice(0, 12),
        vrsEarned: vrsEarnedMap.get(accountId) ?? 0,
        acceptedAnswers: acceptedAnswersMap.get(accountId) ?? 0,
        questionsAsked: questionsAskedMap.get(accountId) ?? 0,
      }))
      // Sort: VRS earned → accepted answers → questions asked
      .sort(
        (a, b) =>
          b.vrsEarned - a.vrsEarned ||
          b.acceptedAnswers - a.acceptedAnswers ||
          b.questionsAsked - a.questionsAsked,
      )
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
          ecosystem. Ranked by total VRS earned from bounties and solutions
          accepted.
        </p>
      </div>

      {/* Top 3 Podiums */}
      <div className="flex flex-row items-end justify-center gap-2 sm:gap-6 pt-4 px-1">
        {[1, 0, 2].map((originalIdx) => {
          const entry = leaderboard[originalIdx];
          if (!entry) return null;

          const isFirst = originalIdx === 0;
          const colors = [
            "border-accent-500/40 bg-accent-500/5 shadow-xl shadow-accent-500/10", // 1st
            "border-slate-400/30 bg-slate-400/5", // 2nd
            "border-amber-700/30 bg-amber-700/5", // 3rd
          ];
          const labels = ["1st", "2nd", "3rd"];

          return (
            <div
              key={entry.accountId}
              className={`flex-1 min-w-0 rounded-xl border flex flex-col items-center text-center transition-all duration-300 ${
                colors[originalIdx]
              } ${isFirst ? "mb-4 sm:mb-8 scale-105 sm:scale-110 z-10 py-5 sm:py-10 border-accent-500/60" : "py-4 sm:py-6"}`}
            >
              <span
                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2 sm:mb-3 ${isFirst ? "text-accent-400" : ""}`}
              >
                {labels[originalIdx]} Place
              </span>

              <div
                className={`${isFirst ? "mb-3 sm:mb-5" : "mb-2 sm:mb-4"} flex items-center justify-center`}
              >
                <div
                  className={`${isFirst ? "scale-110 sm:scale-125" : "scale-90 sm:scale-100"}`}
                >
                  <Avatar accountId={entry.accountId} size={64} hideText />
                </div>
              </div>

              <div className="min-w-0 w-full mb-2 sm:mb-3 px-1">
                <h3
                  className={`font-bold text-text-main truncate text-[10px] sm:text-base ${isFirst ? "text-[12px] sm:text-lg" : ""}`}
                >
                  {entry.displayName}
                </h3>
                <p className="text-[8px] sm:text-[11px] font-mono text-text-muted truncate opacity-50">
                  {entry.accountId}
                </p>
              </div>

              <div className="mt-auto">
                <p
                  className={`font-mono font-bold text-primary-400 text-[12px] sm:text-xl ${isFirst ? "text-[14px] sm:text-2xl" : ""}`}
                >
                  {Math.floor(entry.vrsEarned).toLocaleString()}
                </p>
                <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-text-muted font-bold">
                  VRS
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <p>No VRS holders found on-chain yet. Be the first to earn VRS!</p>
        </div>
      )}

      {/* Full List */}
      {leaderboard.length > 0 && (
        <div className="rounded-lg border border-border-main bg-bg-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left border-collapse">
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
                    VRS Earned
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
                        {entry.vrsEarned.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="ml-1 text-[10px] text-text-muted">
                        VRS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

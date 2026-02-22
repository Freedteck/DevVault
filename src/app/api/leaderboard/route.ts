export const revalidate = 300; // Cache leaderboard for 5 minutes

import { getMessagesWithPagination } from "../../../services/getMessages";
import { TOPICS } from "../../../services/constants";

function getRankLabel(score: number): string {
  if (score >= 1000) return "Legend";
  if (score >= 500) return "Expert";
  if (score >= 200) return "Contributor";
  return "Helper";
}

export const GET = async () => {
  try {
    // Fetch all acceptances + answers to compute scores
    const [{ messages: acceptanceMessages }, { messages: answerMessages }] =
      await Promise.all([
        getMessagesWithPagination(TOPICS.ACCEPTANCES!, 1000, null),
        getMessagesWithPagination(TOPICS.ANSWERS!, 1000, null),
      ]);

    // Map answerId → author
    const answerAuthors: Record<string, string> = {};
    answerMessages.forEach((msg) => {
      const answer = JSON.parse(msg.content);
      answerAuthors[answer.answerId] = answer.author;
    });

    // Count unique accepted answers per author
    const userScores: Record<
      string,
      { username: string; acceptedAnswers: number; score: number }
    > = {};
    const uniqueAcceptedAnswers = new Set<string>();

    acceptanceMessages.forEach((msg) => {
      const acceptance = JSON.parse(msg.content);
      const author = answerAuthors[acceptance.answerId];
      if (!author) return;

      const key = `${author}:${acceptance.answerId}`;
      if (uniqueAcceptedAnswers.has(key)) return;
      uniqueAcceptedAnswers.add(key);

      if (!userScores[author]) {
        userScores[author] = { username: author, acceptedAnswers: 0, score: 0 };
      }
      userScores[author].acceptedAnswers += 1;
      userScores[author].score += 100;
    });

    const leaderboard = Object.values(userScores)
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`,
        rankLabel: getRankLabel(user.score),
      }));

    return Response.json(leaderboard);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return Response.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
};

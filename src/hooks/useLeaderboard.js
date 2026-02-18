/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { getMessagesWithPagination } from "../services/getMessages";
import { TOPICS } from "../services/constants";

/**
 * Hook to fetch and calculate leaderboard data from HCS
 * Ranks users by accepted answers (reputation points)
 */
export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch all acceptances
        const { messages: acceptanceMessages } =
          await getMessagesWithPagination(TOPICS.ACCEPTANCES, 1000, null);

        // Fetch all answers to get author info
        const { messages: answerMessages } = await getMessagesWithPagination(
          TOPICS.ANSWERS,
          1000,
          null,
        );

        // Map answer IDs to authors
        const answerAuthors = {};
        answerMessages.forEach((msg) => {
          const answer = JSON.parse(msg.content);
          answerAuthors[answer.answerId] = answer.author;
        });

        // Calculate reputation scores - count unique accepted answers only
        const userScores = {};
        const uniqueAcceptedAnswers = new Set(); // Track unique answer IDs per user

        acceptanceMessages.forEach((msg) => {
          const acceptance = JSON.parse(msg.content);
          const author = answerAuthors[acceptance.answerId];

          if (author) {
            // Check if this answer was already counted for this user
            const userAnswerKey = `${author}:${acceptance.answerId}`;
            if (uniqueAcceptedAnswers.has(userAnswerKey)) {
              return; // Skip duplicate acceptance
            }
            uniqueAcceptedAnswers.add(userAnswerKey);

            if (!userScores[author]) {
              userScores[author] = {
                username: author,
                acceptedAnswers: 0,
                score: 0,
              };
            }
            userScores[author].acceptedAnswers += 1;
            userScores[author].score += 100;
          }
        });

        // Convert to array and sort by score
        const sortedUsers = Object.values(userScores)
          .sort((a, b) => b.score - a.score)
          .map((user, index) => ({
            ...user,
            rank: index + 1,
            avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`,
            rankLabel: getRankLabel(user.score),
          }));

        setLeaderboard(sortedUsers);
        setError(null);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  return { leaderboard, isLoading, error };
};

/**
 * Determine rank label based on score
 */
function getRankLabel(score) {
  if (score >= 1000) return "Legend";
  if (score >= 500) return "Expert";
  if (score >= 200) return "Contributor";
  return "Helper";
}

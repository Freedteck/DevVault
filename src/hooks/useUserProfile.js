import { useState, useEffect } from "react";
import { getMessagesWithPagination } from "../services/getMessages";
import { TOPICS } from "../services/constants";

/**
 * Hook to fetch user profile data from HCS
 * @param {string} accountId - User's Hedera account ID
 */
export const useUserProfile = (accountId) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);

        // Fetch all questions, answers, and acceptances
        const [questionsData, answersData, acceptancesData] = await Promise.all(
          [
            getMessagesWithPagination(TOPICS.QUESTIONS, 1000, null),
            getMessagesWithPagination(TOPICS.ANSWERS, 1000, null),
            getMessagesWithPagination(TOPICS.ACCEPTANCES, 1000, null),
          ],
        );

        const questions = questionsData.messages.map((m) =>
          JSON.parse(m.content),
        );
        const answers = answersData.messages.map((m) => JSON.parse(m.content));
        const acceptances = acceptancesData.messages.map((m) =>
          JSON.parse(m.content),
        );

        // Calculate user stats
        const userQuestions = questions.filter((q) => q.author === accountId);
        const userAnswers = answers.filter((a) => a.author === accountId);

        // Count unique accepted answers only (ignore duplicate acceptances)
        const acceptedAnswerIds = new Set();

        acceptances.forEach((acceptance) => {
          const answer = answers.find(
            (a) => a.answerId === acceptance.answerId,
          );
          if (answer && answer.author === accountId) {
            acceptedAnswerIds.add(answer.answerId);
          }
        });

        const acceptedAnswersCount = acceptedAnswerIds.size;

        // Calculate reputation score (100 points per accepted answer)
        const reputationScore = acceptedAnswersCount * 100;

        // Determine tier
        let tier = "Helper";
        if (reputationScore >= 1000) tier = "Legend";
        else if (reputationScore >= 500) tier = "Expert";
        else if (reputationScore >= 200) tier = "Contributor";

        // Get recent activity
        const recentActivity = [];

        // Add recent answers with acceptance status
        userAnswers
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5)
          .forEach((answer) => {
            const isAccepted = acceptedAnswerIds.has(answer.answerId);
            const question = questions.find(
              (q) => q.questionId === answer.questionId,
            );
            recentActivity.push({
              type: "answer",
              isAccepted,
              questionTitle: question?.title || "Question",
              timestamp: answer.timestamp,
            });
          });

        // Add recent questions
        userQuestions
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 3)
          .forEach((question) => {
            recentActivity.push({
              type: "question",
              title: question.title,
              timestamp: question.timestamp,
            });
          });

        // Sort by timestamp
        recentActivity.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );

        setProfile({
          accountId,
          username: accountId,
          questionsAsked: userQuestions.length,
          answersProvided: userAnswers.length,
          acceptedAnswers: acceptedAnswersCount,
          reputationScore,
          tier,
          recentActivity: recentActivity.slice(0, 10),
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [accountId]);

  return { profile, isLoading, error };
};

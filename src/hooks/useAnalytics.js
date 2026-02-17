import { useState, useEffect, useCallback } from "react";

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalQuestions: 0,
    totalAnswers: 0,
    totalTips: 0,
    activeUsers: 0,
    isLoading: true,
    error: null,
  });

  const fetchTopicCount = useCallback(async (topicId) => {
    if (!topicId) return 0;

    try {
      // Fetch a large batch to get total count
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100`
      );

      if (!response.ok) {
        console.warn(`Failed to fetch from topic ${topicId}:`, response.status);
        return 0;
      }

      const data = await response.json();
      return data.messages?.length || 0;
    } catch (error) {
      console.warn(`Error fetching from topic ${topicId}:`, error);
      return 0;
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalytics(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const questionsTopicId = import.meta.env.VITE_QUESTIONS_TOPIC_ID;
      const answersTopicId = import.meta.env.VITE_ANSWERS_TOPIC_ID;
      const acceptancesTopicId = import.meta.env.VITE_ACCEPTANCES_TOPIC_ID;

      // Fetch counts from all topics
      const [questionsCount, answersCount, acceptancesCount] = await Promise.all([
        fetchTopicCount(questionsTopicId),
        fetchTopicCount(answersTopicId),
        fetchTopicCount(acceptancesTopicId),
      ]);

      // Calculate unique users from acceptances (contributors who have received accepted answers)
      const uniqueUsers = new Set();

      if (acceptancesTopicId) {
        try {
          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/topics/${acceptancesTopicId}/messages?limit=100`
          );
          if (response.ok) {
            const data = await response.json();
            data.messages?.forEach(message => {
              try {
                const decoded = JSON.parse(atob(message.message));
                if (decoded.answerAuthor) {
                  uniqueUsers.add(decoded.answerAuthor);
                }
              } catch (e) {
                // Skip invalid messages
              }
            });
          }
        } catch (error) {
          console.warn("Error fetching acceptances for user count:", error);
        }
      }

      // Estimate tips based on acceptances (each acceptance likely involves tips)
      // This is a conservative estimate - in reality we'd need to track actual tip transactions
      const estimatedTips = acceptancesCount * 10; // Rough estimate

      setAnalytics({
        totalQuestions: questionsCount,
        totalAnswers: answersCount,
        totalTips: estimatedTips,
        activeUsers: uniqueUsers.size,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalytics(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to load analytics data",
      }));
    }
  }, [fetchTopicCount]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    ...analytics,
    refetch: fetchAnalytics,
  };
};
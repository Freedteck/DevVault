export const revalidate = 120; // Cache profile for 2 minutes

import { NextRequest } from "next/server";
import { getMessagesWithPagination } from "../../../../services/getMessages";
import { TOPICS } from "../../../../services/constants";

function getRankLabel(score: number): string {
  if (score >= 1000) return "Legend";
  if (score >= 500) return "Expert";
  if (score >= 200) return "Contributor";
  return "Helper";
}

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) => {
  try {
    const { accountId } = await params;

    const [questionsData, answersData, acceptancesData] = await Promise.all([
      getMessagesWithPagination(TOPICS.QUESTIONS!, 1000, null),
      getMessagesWithPagination(TOPICS.ANSWERS!, 1000, null),
      getMessagesWithPagination(TOPICS.ACCEPTANCES!, 1000, null),
    ]);

    const questions = questionsData.messages.map((m) => JSON.parse(m.content));
    const answers = answersData.messages.map((m) => JSON.parse(m.content));
    const acceptances = acceptancesData.messages.map((m) =>
      JSON.parse(m.content),
    );

    const userQuestions = questions.filter((q) => q.author === accountId);
    const userAnswers = answers.filter((a) => a.author === accountId);

    const acceptedAnswerIds = new Set<string>();
    acceptances.forEach((acceptance) => {
      const answer = answers.find((a) => a.answerId === acceptance.answerId);
      if (answer && answer.author === accountId) {
        acceptedAnswerIds.add(answer.answerId);
      }
    });

    const acceptedAnswersCount = acceptedAnswerIds.size;
    const reputationScore = acceptedAnswersCount * 100;
    const tier = getRankLabel(reputationScore);

    const recentActivity: any[] = [];

    userAnswers
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
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

    userQuestions
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 3)
      .forEach((question) => {
        recentActivity.push({
          type: "question",
          title: question.title,
          timestamp: question.timestamp,
        });
      });

    recentActivity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return Response.json({
      accountId,
      username: accountId,
      questionsAsked: userQuestions.length,
      answersProvided: userAnswers.length,
      acceptedAnswers: acceptedAnswersCount,
      reputationScore,
      tier,
      recentActivity: recentActivity.slice(0, 10),
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
};

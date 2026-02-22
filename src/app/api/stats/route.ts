import { fetchWithRetry } from "../../../utils/fetchUtils";

export const revalidate = 60; // Revalidate every 60 seconds

export const GET = async () => {
  try {
    const base = "https://testnet.mirrornode.hedera.com/api/v1/topics";
    const questionTopicId = process.env.NEXT_PUBLIC_NEW_QUESTION_TOPIC_ID;
    const answerTopicId = process.env.NEXT_PUBLIC_NEW_ANSWER_TOPIC_ID;
    const acceptanceTopicId = process.env.NEXT_PUBLIC_NEW_ACCEPTANCE_TOPIC_ID;

    // Fetch latest message from each topic — sequence_number equals total count
    const [questionRes, answerRes, acceptanceRes] = await Promise.all([
      fetchWithRetry(`${base}/${questionTopicId}/messages?limit=1&order=desc`),
      fetchWithRetry(`${base}/${answerTopicId}/messages?limit=1&order=desc`),
      fetchWithRetry(
        `${base}/${acceptanceTopicId}/messages?limit=1&order=desc`,
      ),
    ]);

    const [questionData, answerData, acceptanceData] = await Promise.all([
      questionRes.json(),
      answerRes.json(),
      acceptanceRes.json(),
    ]);
    return Response.json({
      questions: questionData.messages?.[0]?.sequence_number ?? 0,
      answers: answerData.messages?.[0]?.sequence_number ?? 0,
      acceptances: acceptanceData.messages?.[0]?.sequence_number ?? 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return Response.json(
      { questions: 0, answers: 0, acceptances: 0 },
      { status: 500 },
    );
  }
};

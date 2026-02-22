import { fetchWithRetry } from "../../utils/fetchUtils";
import styles from "../../app/home.module.css";

async function getStats() {
  try {
    const base = "https://testnet.mirrornode.hedera.com/api/v1/topics";
    const questionTopicId = process.env.NEXT_PUBLIC_NEW_QUESTION_TOPIC_ID;
    const answerTopicId = process.env.NEXT_PUBLIC_NEW_ANSWER_TOPIC_ID;
    const acceptanceTopicId = process.env.NEXT_PUBLIC_NEW_ACCEPTANCE_TOPIC_ID;

    const [questionRes, answerRes, acceptanceRes] = await Promise.all([
      fetchWithRetry(`${base}/${questionTopicId}/messages?limit=1&order=desc`, {
        next: { revalidate: 60 },
      }),
      fetchWithRetry(`${base}/${answerTopicId}/messages?limit=1&order=desc`, {
        next: { revalidate: 60 },
      }),
      fetchWithRetry(
        `${base}/${acceptanceTopicId}/messages?limit=1&order=desc`,
        { next: { revalidate: 60 } },
      ),
    ]);

    const [questionData, answerData, acceptanceData] = await Promise.all([
      questionRes.json(),
      answerRes.json(),
      acceptanceRes.json(),
    ]);

    return {
      questions: questionData.messages?.[0]?.sequence_number ?? 0,
      answers: answerData.messages?.[0]?.sequence_number ?? 0,
      acceptances: acceptanceData.messages?.[0]?.sequence_number ?? 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { questions: 0, answers: 0, acceptances: 0 };
  }
}

export default async function HomeStats() {
  const stats = await getStats();

  return (
    <div className={styles.statsBar}>
      <div className={styles.statItem}>
        <span className={styles.statValue}>{stats.questions}</span>
        <span className={styles.statLabel}>Questions Asked</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.statItem}>
        <span className={styles.statValue}>{stats.answers}</span>
        <span className={styles.statLabel}>Answers Given</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.statItem}>
        <span className={styles.statValue}>{stats.acceptances}</span>
        <span className={styles.statLabel}>Solutions Accepted</span>
      </div>
    </div>
  );
}

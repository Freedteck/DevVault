import { Suspense } from "react";
import QuestionDetailsNew from "../../../components/pages/QuestionDetails";
import DetailSkeleton from "../../../components/features/DetailSkeleton";

export const metadata = {
  title: "Question | DevVault",
};

async function getQuestionData(sequenceNumber: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/questions/${sequenceNumber}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const question = await res.json();

    // Also pre-fetch answers for faster initial load
    const ansRes = await fetch(`${base}/api/answers/${question.questionId}`, {
      next: { revalidate: 30 },
    });
    const answers = ansRes.ok ? await ansRes.json() : [];

    return { question, answers };
  } catch (error) {
    console.error("Error fetching question data on server:", error);
    return null;
  }
}

async function QuestionDetailsContainer({
  sequenceNumber,
}: {
  sequenceNumber: string;
}) {
  const data = await getQuestionData(sequenceNumber);
  return (
    <QuestionDetailsNew
      initialQuestion={data?.question}
      initialAnswers={data?.answers}
    />
  );
}

export default function QuestionDetailsPage({
  params,
}: {
  params: { sequenceNumber: string };
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <QuestionDetailsContainer sequenceNumber={params.sequenceNumber} />
    </Suspense>
  );
}

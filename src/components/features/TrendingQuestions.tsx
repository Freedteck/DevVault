import QuestionCardNew from "./QuestionCardNew";

async function getQuestions() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/questions?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result.questions;
  } catch (error) {
    console.error("Error fetching trending questions:", error);
    return [];
  }
}

export default async function TrendingQuestions() {
  const questions = await getQuestions();

  if (questions.length === 0) {
    return (
      <div
        style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}
      >
        <p style={{ color: "rgba(255,255,255,0.6)" }}>
          No questions yet. Be the first to ask!
        </p>
      </div>
    );
  }

  return (
    <>
      {questions.map((q: any) => (
        <QuestionCardNew key={q.id} question={q} />
      ))}
    </>
  );
}

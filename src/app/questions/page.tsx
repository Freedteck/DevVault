import QuestionsPageMain from "../../components/features/QuestionsPageMain";

export const metadata = {
  title: "Questions Feed | DevVault",
  description: "Earn crypto by solving real-world development challenges.",
};

async function getInitialQuestions() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/questions?limit=10`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching initial questions on server:", error);
    return null;
  }
}

export default async function QuestionsPage() {
  const initialData = await getInitialQuestions();
  return <QuestionsPageMain initialData={initialData} />;
}

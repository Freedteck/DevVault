import UpdatesPageMain from "../../components/features/UpdatesPageMain";

export const metadata = {
  title: "Network Updates | DevVault",
  description: "Stay up to date with the latest from the Hedera ecosystem.",
};

async function getInitialUpdates() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/updates?limit=10`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching initial updates on server:", error);
    return null;
  }
}

export default async function UpdatesPage() {
  const initialData = await getInitialUpdates();
  return <UpdatesPageMain initialData={initialData} />;
}

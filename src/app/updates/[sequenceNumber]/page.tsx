import { Suspense } from "react";
import UpdateDetailsNew from "../../../components/pages/UpdateDetails";
import DetailSkeleton from "../../../components/features/DetailSkeleton";

export const metadata = {
  title: "Update | DevVault",
};

async function getUpdateData(sequenceNumber: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/updates/${sequenceNumber}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const update = await res.json();

    // Pre-fetch comments
    const commRes = await fetch(`${base}/api/comments/${update.updateId}`, {
      next: { revalidate: 30 },
    });
    const comments = commRes.ok ? await commRes.json() : [];

    return { update, comments };
  } catch (error) {
    console.error("Error fetching update data on server:", error);
    return null;
  }
}

async function UpdateDetailsContainer({
  sequenceNumber,
}: {
  sequenceNumber: string;
}) {
  const data = await getUpdateData(sequenceNumber);
  return (
    <UpdateDetailsNew
      initialUpdate={data?.update}
      initialComments={data?.comments}
    />
  );
}

export default function UpdateDetailsPage({
  params,
}: {
  params: { sequenceNumber: string };
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <UpdateDetailsContainer sequenceNumber={params.sequenceNumber} />
    </Suspense>
  );
}

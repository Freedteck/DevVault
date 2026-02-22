import GlassCard from "../../components/ui/GlassCard";
import styles from "../../components/pages/Leaderboard.module.css";
import { Suspense } from "react";
import LeaderboardList from "../../components/features/LeaderboardList";
import TableSkeleton from "../../components/features/TableSkeleton";

export const metadata = {
  title: "Leaderboard | DevVault",
  description: "Top contributors ranked by reputation on DevVault.",
};

export default function LeaderboardPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Top Contributors</h1>
        <p className={styles.subtitle}>
          Recognizing the best developers in the community.
        </p>
      </div>

      <GlassCard className={styles.tableCard} variant="paged">
        <Suspense fallback={<TableSkeleton />}>
          <LeaderboardList />
        </Suspense>
      </GlassCard>
    </div>
  );
}

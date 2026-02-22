import { Trophy, Medal, Award } from "lucide-react";
import styles from "../pages/Leaderboard.module.css";

async function getLeaderboard() {
  try {
    // Force absolute URL for server-side fetch in App Router
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/leaderboard`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={24} color="#fbbf24" />;
  if (rank === 2) return <Medal size={24} color="#94a3b8" />;
  if (rank === 3) return <Award size={24} color="#b45309" />;
  return <span className={styles.rankNum}>{rank}</span>;
}

export default async function LeaderboardList() {
  const leaderboard = await getLeaderboard();

  if (leaderboard.length === 0) {
    return (
      <p
        style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--text-secondary)",
        }}
      >
        No contributors yet. Be the first to answer a question!
      </p>
    );
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.rankCol}>Rank</th>
          <th>Developer</th>
          <th>Reputation</th>
          <th className={styles.scoreCol}>Score</th>
        </tr>
      </thead>
      <tbody>
        {leaderboard.map((user: any) => (
          <tr key={user.username} className={styles.row}>
            <td className={styles.rankCol}>
              <div className={styles.rankBadging}>
                <RankIcon rank={user.rank} />
              </div>
            </td>
            <td>
              <div className={styles.userCell}>
                <img
                  src={user.avatar}
                  alt={user.username}
                  className={styles.avatar}
                />
                <div className={styles.userInfo}>
                  <span className={styles.username}>{user.username}</span>
                  <span className={styles.userRank}>{user.rankLabel}</span>
                </div>
              </div>
            </td>
            <td>
              <div className={styles.repBar}>
                <div
                  className={styles.repFill}
                  style={{
                    width: `${Math.min((user.score / 1000) * 100, 100)}%`,
                  }}
                />
              </div>
            </td>
            <td className={styles.scoreCol}>
              <span className={styles.score}>
                {user.score.toLocaleString()}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

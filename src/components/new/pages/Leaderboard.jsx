import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { MOCK_LEADERBOARD } from '../data/mock';
import styles from './Leaderboard.module.css';

const RankIcon = ({ rank }) => {
  if (rank === 1) return <Trophy size={24} color="#fbbf24" />; // Gold
  if (rank === 2) return <Medal size={24} color="#94a3b8" />; // Silver
  if (rank === 3) return <Award size={24} color="#b45309" />; // Bronze
  return <span className={styles.rankNum}>{rank}</span>;
}

const LeaderboardNew = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Top Contributors</h1>
        <p className={styles.subtitle}>Recognizing the best developers in the community.</p>
      </div>

      <GlassCard className={styles.tableCard} variant="paged">
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
            {MOCK_LEADERBOARD.map((user, index) => (
              <tr key={index} className={styles.row}>
                <td className={styles.rankCol}>
                  <div className={styles.rankBadging}>
                    <RankIcon rank={index + 1} />
                  </div>
                </td>
                <td>
                  <div className={styles.userCell}>
                    <img src={user.avatar} alt={user.username} className={styles.avatar} />
                    <div className={styles.userInfo}>
                      <span className={styles.username}>{user.username}</span>
                      <span className={styles.userRank}>{user.rankLabel || user.rank}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.repBar}>
                    <div className={styles.repFill} style={{width: `${(user.score / 10000) * 100}%`}} />
                  </div>
                </td>
                <td className={styles.scoreCol}>
                  <span className={styles.score}>{user.score.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};

export default LeaderboardNew;

import { useState, useEffect } from "react";
import { Trophy, Award, Medal, TrendingUp } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import styles from "./Leaderboard.module.css";

const Leaderboard = () => {
  const [contributors, setContributors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const topicId = import.meta.env.VITE_TOPIC_ID;
  const tokenId = import.meta.env.VITE_TOKEN_ID;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
        );
        const data = await response.json();

        // Get unique contributors
        const uniqueContributors = {};
        data.messages.forEach((msg) => {
          const payer = msg.payer_account_id;
          if (!uniqueContributors[payer]) {
            uniqueContributors[payer] = {
              accountId: payer,
              contributions: 0,
              tokens: 0,
            };
          }
          uniqueContributors[payer].contributions++;
        });

        // Fetch token balances
        const contributorsArray = Object.values(uniqueContributors);
        const balancePromises = contributorsArray.map(async (contributor) => {
          try {
            const balanceResponse = await fetch(
              `https://testnet.mirrornode.hedera.com/api/v1/accounts/${contributor.accountId}/tokens?token.id=${tokenId}`
            );
            const balanceData = await balanceResponse.json();
            if (balanceData.tokens && balanceData.tokens.length > 0) {
              contributor.tokens = balanceData.tokens[0].balance;
            }
          } catch (error) {
            console.error("Failed to fetch balance:", error);
          }
          return contributor;
        });

        const contributorsWithBalances = await Promise.all(balancePromises);
        contributorsWithBalances.sort((a, b) => b.tokens - a.tokens);

        setContributors(contributorsWithBalances);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [topicId, tokenId]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 0:
        return <Trophy size={24} className={styles.gold} />;
      case 1:
        return <Award size={24} className={styles.silver} />;
      case 2:
        return <Medal size={24} className={styles.bronze} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.leaderboard}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Trophy size={32} />
          </div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Leaderboard</h1>
            <p className={styles.subtitle}>
              Top contributors ranked by DVT tokens earned
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <p>Loading leaderboard...</p>
          </div>
        ) : contributors.length === 0 ? (
          <Card padding="lg">
            <div className={styles.empty}>
              <TrendingUp size={48} className={styles.emptyIcon} />
              <h3>No contributors yet</h3>
              <p>Start contributing to appear on the leaderboard!</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Top 3 */}
            {contributors.length >= 3 && (
              <div className={styles.topThree}>
                {contributors.slice(0, 3).map((contributor, index) => (
                  <Card key={index} padding="lg" className={styles.topCard}>
                    <div className={styles.topRank}>
                      {getRankIcon(index)}
                      <div className={styles.rankNumber}>#{index + 1}</div>
                    </div>
                    <div className={styles.accountId}>
                      {contributor.accountId}
                    </div>
                    <div className={styles.stats}>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>
                          {contributor.contributions}
                        </div>
                        <div className={styles.statLabel}>Posts</div>
                      </div>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>
                          {contributor.tokens}
                        </div>
                        <div className={styles.statLabel}>DVT</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Rest of the table */}
            {contributors.length > 3 && (
              <Card padding="none">
                <div className={styles.table}>
                  <div className={styles.tableHeader}>
                    <div className={styles.rank}>Rank</div>
                    <div className={styles.contributor}>Contributor</div>
                    <div className={styles.contributions}>Contributions</div>
                    <div className={styles.tokens}>DVT Tokens</div>
                  </div>
                  {contributors.slice(3).map((contributor, index) => (
                    <div key={index} className={styles.row}>
                      <div className={styles.rank}>
                        <Badge variant="default">#{index + 4}</Badge>
                      </div>
                      <div className={styles.contributor}>
                        {contributor.accountId}
                      </div>
                      <div className={styles.contributions}>
                        {contributor.contributions}
                      </div>
                      <div className={styles.tokens}>
                        {contributor.tokens} DVT
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

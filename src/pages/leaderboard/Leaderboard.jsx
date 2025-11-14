import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Award, Medal, TrendingUp } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import UserWithBadge from "../../components/ui/UserWithBadge";
import styles from "./Leaderboard.module.css";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [contributors, setContributors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const acceptancesTopicId = import.meta.env.VITE_ACCEPTANCES_TOPIC_ID;
  const tokenId = import.meta.env.VITE_TOKEN_ID;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch acceptances to get contributors with accepted answers
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${acceptancesTopicId}/messages`
        );
        const data = await response.json();

        // Count accepted answers per answerer
        const answerersCount = {};
        data.messages.forEach((msg) => {
          try {
            const decoded = JSON.parse(atob(msg.message));
            console.log("Decoded acceptance:", decoded);
            const answerer = decoded.answerAuthor; // Changed from answererId to answerAuthor
            if (answerer) {
              if (!answerersCount[answerer]) {
                answerersCount[answerer] = {
                  accountId: answerer,
                  acceptedAnswers: 0,
                  tokens: 0,
                };
              }
              answerersCount[answerer].acceptedAnswers++;
            }
          } catch (error) {
            console.error("Error parsing acceptance:", error);
          }
        });

        // Fetch token balances
        const contributorsArray = Object.values(answerersCount);
        console.log(
          "Contributors array before balance fetch:",
          contributorsArray
        );

        const balancePromises = contributorsArray.map(async (contributor) => {
          try {
            const balanceResponse = await fetch(
              `https://testnet.mirrornode.hedera.com/api/v1/accounts/${contributor.accountId}/tokens?token.id=${tokenId}`
            );
            const balanceData = await balanceResponse.json();
            console.log(`Balance for ${contributor.accountId}:`, balanceData);
            if (balanceData.tokens && balanceData.tokens.length > 0) {
              contributor.tokens = balanceData.tokens[0].balance;
            }
          } catch (error) {
            console.error("Failed to fetch balance:", error);
          }
          return contributor;
        });

        const contributorsWithBalances = await Promise.all(balancePromises);

        // Sort by accepted answers, then by tokens
        contributorsWithBalances.sort((a, b) => {
          if (b.acceptedAnswers !== a.acceptedAnswers) {
            return b.acceptedAnswers - a.acceptedAnswers;
          }
          return b.tokens - a.tokens;
        });

        setContributors(contributorsWithBalances);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [acceptancesTopicId, tokenId]);

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
              Top contributors ranked by accepted answers and DVT tokens earned
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
            {contributors.length > 0 && contributors.length <= 3 && (
              <div className={styles.topThree}>
                {contributors.map((contributor, index) => (
                  <Card
                    key={index}
                    padding="lg"
                    className={styles.topCard}
                    onClick={() =>
                      navigate(`/profile/${contributor.accountId}`)
                    }
                    hover
                  >
                    <div className={styles.topRank}>
                      {getRankIcon(index)}
                      <div className={styles.rankNumber}>#{index + 1}</div>
                    </div>
                    <div className={styles.topContributor}>
                      <UserWithBadge accountId={contributor.accountId} />
                    </div>
                    <div className={styles.stats}>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>
                          {contributor.acceptedAnswers}
                        </div>
                        <div className={styles.statLabel}>Accepted</div>
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

            {/* Top 3 for more than 3 contributors */}
            {contributors.length > 3 && (
              <div className={styles.topThree}>
                {contributors.slice(0, 3).map((contributor, index) => (
                  <Card
                    key={index}
                    padding="lg"
                    className={styles.topCard}
                    onClick={() =>
                      navigate(`/profile/${contributor.accountId}`)
                    }
                    hover
                  >
                    <div className={styles.topRank}>
                      {getRankIcon(index)}
                      <div className={styles.rankNumber}>#{index + 1}</div>
                    </div>
                    <div className={styles.topContributor}>
                      <UserWithBadge accountId={contributor.accountId} />
                    </div>
                    <div className={styles.stats}>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>
                          {contributor.acceptedAnswers}
                        </div>
                        <div className={styles.statLabel}>Accepted</div>
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
                    <div className={styles.contributions}>Accepted Answers</div>
                    <div className={styles.tokens}>DVT Tokens</div>
                  </div>
                  {contributors.slice(3).map((contributor, index) => (
                    <div
                      key={index}
                      className={styles.row}
                      onClick={() =>
                        navigate(`/profile/${contributor.accountId}`)
                      }
                    >
                      <div className={styles.rank}>
                        <Badge variant="default">#{index + 4}</Badge>
                      </div>
                      <div className={styles.contributor}>
                        <UserWithBadge accountId={contributor.accountId} />
                      </div>
                      <div className={styles.contributions}>
                        {contributor.acceptedAnswers}
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

import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Wallet, MessageSquare, Award, Filter } from "lucide-react";
import { userWalletContext } from "../../context/userWalletContext";
import Card from "../../components/ui/Card";
import QuestionCard from "../../components/features/QuestionCard";
import UpdateCard from "../../components/features/UpdateCard";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const { accountId, balance } = useContext(userWalletContext);
  const [contributions, setContributions] = useState([]);
  const [filteredContributions, setFilteredContributions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [dvtBalance, setDvtBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const topicId = import.meta.env.VITE_TOPIC_ID;
  const tokenId = import.meta.env.VITE_TOKEN_ID;

  useEffect(() => {
    if (!accountId) return;

    const fetchProfileData = async () => {
      try {
        // Fetch contributions
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
        );
        const data = await response.json();

        const userContributions = data.messages
          .filter((msg) => {
            try {
              const decoded = JSON.parse(atob(msg.message));
              return decoded.accountId === accountId;
            } catch {
              return false;
            }
          })
          .map((msg) => {
            const decoded = JSON.parse(atob(msg.message));
            return {
              ...decoded,
              date: new Date(
                parseInt(msg.consensus_timestamp.split(".")[0]) * 1000
              ).toISOString(),
            };
          });

        setContributions(userContributions);
        setFilteredContributions(userContributions);

        // Fetch DVT token balance
        const tokenResponse = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`
        );
        const tokenData = await tokenResponse.json();
        if (tokenData.tokens && tokenData.tokens.length > 0) {
          setDvtBalance(tokenData.tokens[0].balance);
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [accountId, topicId, tokenId]);

  useEffect(() => {
    if (filter === "all") {
      setFilteredContributions(contributions);
    } else {
      setFilteredContributions(contributions.filter((c) => c.type === filter));
    }
  }, [filter, contributions]);

  if (!accountId) {
    return (
      <div className={styles.profile}>
        <div className={styles.container}>
          <Card padding="lg">
            <div className={styles.empty}>
              <Wallet size={48} className={styles.emptyIcon} />
              <h2>Connect Your Wallet</h2>
              <p>Please connect your HashPack wallet to view your profile</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Stats data
  const stats = [
    {
      icon: <MessageSquare size={24} />,
      label: "Contributions",
      value: contributions.length.toString(),
    },
    {
      icon: <Award size={24} />,
      label: "DVT Earned",
      value: dvtBalance.toString(),
    },
    {
      icon: <Wallet size={24} />,
      label: "HBAR Balance",
      value: balance || "0",
    },
  ];

  return (
    <div className={styles.profile}>
      <div className={styles.container}>
        {/* Profile Header */}
        <Card padding="lg" className={styles.header}>
          <div className={styles.avatar}>
            <User size={32} />
          </div>
          <div className={styles.info}>
            <h1 className={styles.accountId}>{accountId}</h1>
            <p className={styles.joined}>
              Member since {new Date().toLocaleDateString()}
            </p>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <Card key={index} padding="lg" hover>
              <div className={styles.stat}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>{stat.label}</div>
                  <div className={styles.statValue}>{stat.value}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Contributions Section */}
        <Card padding="lg">
          <div className={styles.contributionsSection}>
            <div className={styles.contributionsHeader}>
              <h2 className={styles.sectionTitle}>Your Contributions</h2>
              <div className={styles.filterGroup}>
                <Filter size={16} />
                <select
                  className={styles.filterSelect}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All ({contributions.length})</option>
                  <option value="question">
                    Questions (
                    {contributions.filter((c) => c.type === "question").length})
                  </option>
                  <option value="update">
                    Updates (
                    {contributions.filter((c) => c.type === "update").length})
                  </option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className={styles.empty}>
                <p>Loading contributions...</p>
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className={styles.empty}>
                <MessageSquare size={48} className={styles.emptyIcon} />
                <p>
                  {filter === "all"
                    ? "No contributions yet. Start sharing your knowledge!"
                    : `No ${filter}s yet`}
                </p>
              </div>
            ) : (
              <div className={styles.contributionsGrid}>
                {filteredContributions.map((contribution, index) =>
                  contribution.type === "question" ? (
                    <QuestionCard
                      key={index}
                      question={contribution}
                      onClick={() =>
                        navigate(`/question/${index}`, {
                          state: { question: contribution },
                        })
                      }
                    />
                  ) : (
                    <UpdateCard
                      key={index}
                      update={contribution}
                      onClick={() =>
                        navigate(`/update/${index}`, {
                          state: { update: contribution },
                        })
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

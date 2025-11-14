import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, Wallet, MessageSquare, Filter } from "lucide-react";
import { userWalletContext } from "../../context/userWalletContext";
import Card from "../../components/ui/Card";
import QuestionCard from "../../components/features/QuestionCard";
import UpdateCard from "../../components/features/UpdateCard";
import BadgeSVG from "../../components/badges/BadgeSVG";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { accountId: connectedAccountId, balance } =
    useContext(userWalletContext);

  // Use URL param if provided, otherwise use connected wallet
  const accountId = id || connectedAccountId;
  const [contributions, setContributions] = useState([]);
  const [filteredContributions, setFilteredContributions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [dvtBalance, setDvtBalance] = useState(0);
  const [acceptanceCount, setAcceptanceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const questionsTopicId = import.meta.env.VITE_QUESTIONS_TOPIC_ID;
  const updatesTopicId = import.meta.env.VITE_UPDATES_TOPIC_ID;
  const tokenId = import.meta.env.VITE_TOKEN_ID;
  const acceptancesTopicId = import.meta.env.VITE_ACCEPTANCES_TOPIC_ID;

  useEffect(() => {
    if (!accountId) return;

    const fetchProfileData = async () => {
      try {
        // Fetch questions by user
        const questionsResponse = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${questionsTopicId}/messages`
        );
        const questionsData = await questionsResponse.json();

        const userQuestions = questionsData.messages
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
              sequence_number: msg.sequence_number,
              consensus_timestamp: msg.consensus_timestamp,
              date: new Date(
                parseInt(msg.consensus_timestamp.split(".")[0]) * 1000
              ).toISOString(),
            };
          });

        // Fetch updates by user
        const updatesResponse = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${updatesTopicId}/messages`
        );
        const updatesData = await updatesResponse.json();

        const userUpdates = updatesData.messages
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
              sequence_number: msg.sequence_number,
              consensus_timestamp: msg.consensus_timestamp,
              date: new Date(
                parseInt(msg.consensus_timestamp.split(".")[0]) * 1000
              ).toISOString(),
            };
          });

        const userContributions = [...userQuestions, ...userUpdates];
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

        // Fetch acceptance count
        const acceptancesResponse = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${acceptancesTopicId}/messages`
        );
        const acceptancesData = await acceptancesResponse.json();

        const userAcceptances = acceptancesData.messages
          .map((msg) => {
            try {
              const decoded = JSON.parse(atob(msg.message));
              return decoded;
            } catch {
              return null;
            }
          })
          .filter(
            (acceptance) =>
              acceptance &&
              acceptance.type === "acceptance" &&
              acceptance.answerAuthor === accountId
          );

        setAcceptanceCount(userAcceptances.length);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [
    accountId,
    questionsTopicId,
    updatesTopicId,
    tokenId,
    acceptancesTopicId,
  ]);

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
      icon: <Wallet size={24} />,
      label: "DVT Earned",
      value: dvtBalance.toString(),
    },
    {
      icon: <Wallet size={24} />,
      label: "HBAR Balance",
      value: balance || "0",
    },
  ];

  // Badge tiers
  const badgeTiers = [
    { name: "Helper", required: 25, color: "#cd7f32" }, // Bronze
    { name: "Contributor", required: 100, color: "#71717a" }, // Darker Silver/Gray
    { name: "Expert", required: 300, color: "#d97706" }, // Darker Gold/Amber
    { name: "Legend", required: 1000, color: "#9333ea" }, // Purple/Violet for premium feel
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

        {/* Stats Grid - Only show for connected user's own profile */}
        {accountId === connectedAccountId && (
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
        )}

        {/* Badges Section */}
        <Card padding="lg">
          <h2 className={styles.sectionTitle}>Achievement Badges</h2>
          <p className={styles.badgesDescription}>
            Earn badges by getting your answers accepted! Each badge tier
            unlocks as you reach milestones.
          </p>
          <div className={styles.badgesGrid}>
            {badgeTiers.map((badge, index) => {
              const isEarned = acceptanceCount >= badge.required;

              return (
                <div
                  key={index}
                  className={`${styles.badge} ${
                    isEarned ? styles.badgeEarned : styles.badgeLocked
                  }`}
                  style={{
                    background: isEarned
                      ? `linear-gradient(135deg, ${badge.color}20 0%, ${badge.color}10 50%, ${badge.color}05 100%)`
                      : "var(--bg-primary)",
                    borderColor: isEarned
                      ? `${badge.color}50`
                      : "var(--border)",
                    color: isEarned ? badge.color : "inherit",
                  }}
                >
                  {isEarned && <span className={styles.badgeSparkle}>✨</span>}
                  <div className={styles.badgeSVG}>
                    <BadgeSVG
                      tier={badge.name}
                      color={badge.color}
                      earned={isEarned}
                    />
                  </div>
                  <div className={styles.badgeInfo}>
                    <h3 className={styles.badgeName}>{badge.name}</h3>
                    <p className={styles.badgeRequirement}>
                      {isEarned
                        ? "Earned! ✨"
                        : `${badge.required} accepted answers required`}
                    </p>
                    <div className={styles.badgeProgress}>
                      <div
                        className={styles.badgeProgressBar}
                        style={{
                          width: `${Math.min(
                            (acceptanceCount / badge.required) * 100,
                            100
                          )}%`,
                          background: badge.color,
                        }}
                      />
                    </div>
                    <p className={styles.badgeCount}>
                      {acceptanceCount} / {badge.required}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Contributions Section */}
        <Card padding="lg">
          <div className={styles.contributionsSection}>
            <div className={styles.contributionsHeader}>
              <h2 className={styles.sectionTitle}>Top Contributions</h2>
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
                {filteredContributions.map((contribution) =>
                  contribution.type === "question" ? (
                    <QuestionCard
                      key={contribution.sequence_number}
                      question={contribution}
                      onClick={() =>
                        navigate(`/question/${contribution.sequence_number}`, {
                          state: { question: contribution },
                        })
                      }
                    />
                  ) : (
                    <UpdateCard
                      key={contribution.sequence_number}
                      update={contribution}
                      onClick={() =>
                        navigate(`/update/${contribution.sequence_number}`, {
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

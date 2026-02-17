import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, Wallet, MessageSquare, Filter, Award } from "lucide-react";
import toast from "react-hot-toast";
import { userWalletContext } from "../../context/userWalletContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import QuestionCard from "../../components/features/QuestionCard";
import UpdateCard from "../../components/features/UpdateCard";
import BadgeSVG from "../../components/badges/BadgeSVG";
import { mintNFTBadge } from "../../client/mintNFTBadge";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { accountId: connectedAccountId, balance, walletData } =
    useContext(userWalletContext);

  // Use URL param if provided, otherwise use connected wallet
  const accountId = id || connectedAccountId;
  const [contributions, setContributions] = useState([]);
  const [filteredContributions, setFilteredContributions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [dvtBalance, setDvtBalance] = useState(0);
  const [acceptanceCount, setAcceptanceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [ownedBadges, setOwnedBadges] = useState([]);
  const [mintingBadge, setMintingBadge] = useState(null);

  const questionsTopicId = import.meta.env.VITE_QUESTIONS_TOPIC_ID;
  const updatesTopicId = import.meta.env.VITE_UPDATES_TOPIC_ID;
  const tokenId = import.meta.env.VITE_TOKEN_ID;
  const acceptancesTopicId = import.meta.env.VITE_ACCEPTANCES_TOPIC_ID;
  const nftCollectionId = import.meta.env.VITE_NFT_BADGE_COLLECTION_ID;

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

        // Fetch user's badge NFTs to check what they already own
        if (nftCollectionId) {
          const nftResponse = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts?token.id=${nftCollectionId}`
          );
          const nftData = await nftResponse.json();
          
          // Extract badge tiers from owned NFTs metadata
          if (nftData.nfts && nftData.nfts.length > 0) {
            const badgePromises = nftData.nfts.map(async (nft) => {
              try {
                const metadataBytes = atob(nft.metadata);
                const metadata = JSON.parse(metadataBytes);
                
                // Handle both old format (attributes) and new format (t: tier)
                if (metadata.t) {
                  return metadata.t; // New minimal format
                } else if (metadata.attributes) {
                  // Old format
                  const tierAttr = metadata.attributes.find(
                    (attr) => attr.trait_type === "Tier"
                  );
                  return tierAttr?.value;
                }
                return null;
              } catch (err) {
                console.warn("Failed to parse NFT metadata:", err);
                return null;
              }
            });
            const badges = await Promise.all(badgePromises);
            setOwnedBadges(badges.filter((b) => b !== null));
          }
        }
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
    nftCollectionId,
  ]);

  // Function to refetch badge ownership
  const refetchBadgeOwnership = async () => {
    if (!nftCollectionId || !accountId) return;

    try {
      const nftResponse = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts?token.id=${nftCollectionId}`
      );
      const nftData = await nftResponse.json();
      
      if (nftData.nfts && nftData.nfts.length > 0) {
        const badgePromises = nftData.nfts.map(async (nft) => {
          try {
            const metadataBytes = atob(nft.metadata);
            const metadata = JSON.parse(metadataBytes);
            
            // Handle both old format (attributes) and new format (t: tier)
            if (metadata.t) {
              return metadata.t;
            } else if (metadata.attributes) {
              const tierAttr = metadata.attributes.find(
                (attr) => attr.trait_type === "Tier"
              );
              return tierAttr?.value;
            }
            return null;
          } catch (err) {
            console.warn("Failed to parse NFT metadata:", err);
            return null;
          }
        });
        const badges = await Promise.all(badgePromises);
        setOwnedBadges(badges.filter((b) => b !== null));
      } else {
        setOwnedBadges([]);
      }
    } catch (error) {
      console.error("Failed to refetch badge ownership:", error);
    }
  };

  // Handle badge claiming
  const handleClaimBadge = async (badge) => {
    if (!walletData || !connectedAccountId) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!nftCollectionId) {
      toast.error("Badge collection not configured");
      return;
    }

    setMintingBadge(badge.name);

    try {
      const loadingToast = toast.loading(`Minting ${badge.name} badge...`);
      
      const result = await mintNFTBadge(
        walletData,
        connectedAccountId,
        nftCollectionId,
        {
          tier: badge.name,
          color: badge.color,
          required: badge.required,
          earned: acceptanceCount,
        }
      );

      toast.dismiss(loadingToast);
      toast.success(
        `🎉 ${badge.name} badge minted! Serial #${result.serialNumber}`
      );

      // Wait a bit for Mirror Node to update, then refetch badge ownership
      setTimeout(async () => {
        await refetchBadgeOwnership();
      }, 3000); // 3 second delay for Mirror Node
      
      // Optimistically update UI immediately
      setOwnedBadges([...ownedBadges, badge.name]);
    } catch (error) {
      console.error("Failed to mint badge:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack
      });
      toast.dismiss();
      
      const errorMessage = error.message || error.toString() || "Unknown error";
      toast.error(`Failed to mint badge: ${errorMessage}`);
    } finally {
      setMintingBadge(null);
    }
  };

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

  // Badge tiers (Reduced for testing/demo)
  const badgeTiers = [
    { name: "Helper", required: 1, color: "#cd7f32" }, // Bronze - 1 acceptance
    { name: "Contributor", required: 3, color: "#71717a" }, // Silver - 3 acceptances
    { name: "Expert", required: 5, color: "#d97706" }, // Gold - 5 acceptances
    { name: "Legend", required: 10, color: "#9333ea" }, // Purple - 10 acceptances
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
              const isOwned = ownedBadges.includes(badge.name);
              const canClaim =
                isEarned &&
                !isOwned &&
                accountId === connectedAccountId &&
                walletData;
              const isMinting = mintingBadge === badge.name;

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
                  {/* Claim Badge Button - Absolute positioned */}
                  {canClaim && (
                    <Button
                      onClick={() => handleClaimBadge(badge)}
                      disabled={isMinting}
                      variant="primary"
                      size="sm"
                      className={styles.claimButton}
                      style={{
                        background: badge.color,
                        borderColor: badge.color,
                      }}
                    >
                      {isMinting ? (
                        <>
                          <Award size={14} className={styles.buttonIcon} />
                          Minting...
                        </>
                      ) : (
                        <>
                          <Award size={14} className={styles.buttonIcon} />
                          Claim
                        </>
                      )}
                    </Button>
                  )}

                  {isOwned && (
                    <span className={styles.badgeOwned}>✨ Claimed</span>
                  )}
                  
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
                      {isOwned
                        ? "Badge Owned"
                        : isEarned
                        ? "Eligible to Claim!"
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

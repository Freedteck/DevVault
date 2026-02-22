import React, { useContext } from "react";
import { Award, MessageSquare, CheckCircle, HelpCircle } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { userWalletContext } from "../../context/userWalletContext";
import { getBadgeComponent } from "../ui/BadgeIcons";
import ProfileSkeleton from "../features/ProfileSkeleton";
import styles from "./Profile.module.css";

interface ProfileData {
  accountId: string;
  username: string;
  questionsAsked: number;
  answersProvided: number;
  acceptedAnswers: number;
  reputationScore: number;
  tier: string;
  recentActivity: Array<{
    type: "question" | "answer";
    title?: string;
    questionTitle?: string;
    isAccepted?: boolean;
    timestamp: number;
  }>;
}

const ProfileNew = () => {
  const { accountId, balance } = useContext(userWalletContext);
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!accountId) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/profile/${accountId}`);
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [accountId]);

  if (!accountId) {
    return (
      <div className={styles.container}>
        <GlassCard>
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
              Connect your wallet to view your profile
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <GlassCard>
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-error)" }}>
              Error loading profile: {error}
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const BadgeIcon = getBadgeComponent(profile?.tier || "Helper");

  return (
    <div className={styles.container}>
      <GlassCard className={styles.headerCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <img
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${accountId}`}
              alt={accountId}
              className={styles.avatar}
            />
            <div className={styles.badge}>
              {BadgeIcon && <BadgeIcon size={20} />}
              <span>{profile?.tier || "Helper"}</span>
            </div>
          </div>

          <div className={styles.userInfo}>
            <h1 className={styles.accountId}>{accountId}</h1>
            <div className={styles.balanceInfo}>
              <span className={styles.balance}>
                {balance !== null && balance !== undefined
                  ? `${(balance as any).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HBAR`
                  : "Loading..."}
              </span>
              <span className={styles.balanceLabel}>Wallet Balance</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className={styles.statsGrid}>
        <GlassCard>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Award size={24} color="#8b5cf6" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {profile?.reputationScore || 0}
              </span>
              <span className={styles.statLabel}>Reputation Score</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <CheckCircle size={24} color="#10b981" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {profile?.acceptedAnswers || 0}
              </span>
              <span className={styles.statLabel}>Accepted Answers</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <MessageSquare size={24} color="#6366f1" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {profile?.answersProvided || 0}
              </span>
              <span className={styles.statLabel}>Total Answers</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <HelpCircle size={24} color="#06b6d4" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {profile?.questionsAsked || 0}
              </span>
              <span className={styles.statLabel}>Questions Asked</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        {!profile?.recentActivity || profile.recentActivity.length === 0 ? (
          <p className={styles.emptyState}>No recent activity</p>
        ) : (
          <div className={styles.activityList}>
            {profile.recentActivity.map((activity: any, index: number) => (
              <div key={index} className={styles.activityItem}>
                {activity.type === "answer" ? (
                  <>
                    <div className={styles.activityIcon}>
                      {activity.isAccepted ? (
                        <CheckCircle size={20} color="var(--success)" />
                      ) : (
                        <MessageSquare
                          size={20}
                          color="var(--text-secondary)"
                        />
                      )}
                    </div>
                    <div className={styles.activityContent}>
                      <span className={styles.activityText}>
                        {activity.isAccepted
                          ? "Answer accepted on"
                          : "Answered"}{" "}
                        {activity.questionTitle}
                      </span>
                      <span className={styles.activityTime}>
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.activityIcon}>
                      <HelpCircle size={20} color="var(--text-secondary)" />
                    </div>
                    <div className={styles.activityContent}>
                      <span className={styles.activityText}>
                        Asked: {activity.title}
                      </span>
                      <span className={styles.activityTime}>
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

function formatTimeAgo(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (minutes > 0)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  return "Just now";
}

export default ProfileNew;

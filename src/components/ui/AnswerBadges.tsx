import { Shield, CheckCircle, Bot, Sparkles } from "lucide-react";
import styles from "./AnswerBadges.module.css";

interface BadgeProps {
  className?: string;
}

export const AIVerifiedBadge = ({ className }: BadgeProps) => (
  <div className={`${styles.badge} ${styles.aiVerified} ${className || ""}`}>
    <CheckCircle size={14} />
    <span>AI-Verified</span>
  </div>
);

export const AIArbitratedBadge = ({ className }: BadgeProps) => (
  <div className={`${styles.badge} ${styles.aiArbitrated} ${className || ""}`}>
    <Shield size={14} />
    <span>AI-Arbitrated</span>
  </div>
);

export const HumanAcceptedBadge = ({ className }: BadgeProps) => (
  <div className={`${styles.badge} ${styles.humanAccepted} ${className || ""}`}>
    <CheckCircle size={14} />
    <span>Accepted Answer</span>
  </div>
);

export const AIInstantBadge = ({ className }: BadgeProps) => (
  <div className={`${styles.badge} ${styles.aiInstant} ${className || ""}`}>
    <Bot size={14} />
    <span>AI Answer</span>
  </div>
);

interface CommunityVerifiedBadgeProps extends BadgeProps {
  voteCount: number;
}

export const CommunityVerifiedBadge = ({
  voteCount,
  className,
}: CommunityVerifiedBadgeProps) => (
  <div
    className={`${styles.badge} ${styles.communityVerified} ${className || ""}`}
  >
    <Sparkles size={14} />
    <span>Community Verified ({voteCount})</span>
  </div>
);

interface AnswerTypeBadgeProps {
  isAccepted?: boolean;
  isAIAnswer?: boolean;
  isArbitrated?: boolean;
  isCommunityVerified?: boolean;
  voteCount?: number;
}

export const AnswerTypeBadge = ({
  isAccepted,
  isAIAnswer,
  isArbitrated,
  isCommunityVerified,
  voteCount,
}: AnswerTypeBadgeProps) => {
  if (isAccepted) return <HumanAcceptedBadge />;
  if (isArbitrated) return <AIArbitratedBadge />;
  if (isCommunityVerified && (voteCount ?? 0) >= 5)
    return <CommunityVerifiedBadge voteCount={voteCount!} />;
  if (isAIAnswer) return <AIInstantBadge />;
  return null;
};

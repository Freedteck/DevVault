import { Shield, CheckCircle, Bot, Sparkles } from "lucide-react";
import styles from "./AnswerBadges.module.css";
import PropTypes from "prop-types";

/**
 * Badge components for different answer verification states
 */

export const AIVerifiedBadge = ({ className }) => (
  <div className={`${styles.badge} ${styles.aiVerified} ${className || ""}`}>
    <CheckCircle size={14} />
    <span>AI-Verified</span>
  </div>
);

export const AIArbitratedBadge = ({ className }) => (
  <div className={`${styles.badge} ${styles.aiArbitrated} ${className || ""}`}>
    <Shield size={14} />
    <span>AI-Arbitrated</span>
  </div>
);

export const HumanAcceptedBadge = ({ className }) => (
  <div className={`${styles.badge} ${styles.humanAccepted} ${className || ""}`}>
    <CheckCircle size={14} />
    <span>Accepted Answer</span>
  </div>
);

export const AIInstantBadge = ({ className }) => (
  <div className={`${styles.badge} ${styles.aiInstant} ${className || ""}`}>
    <Bot size={14} />
    <span>AI Answer</span>
  </div>
);

export const CommunityVerifiedBadge = ({ voteCount, className }) => (
  <div
    className={`${styles.badge} ${styles.communityVerified} ${className || ""}`}
  >
    <Sparkles size={14} />
    <span>Community Verified ({voteCount})</span>
  </div>
);

/**
 * Combined badge component - auto-selects based on answer type
 */
export const AnswerTypeBadge = ({
  isAccepted,
  isAIAnswer,
  isArbitrated,
  isCommunityVerified,
  voteCount,
}) => {
  if (isAccepted) return <HumanAcceptedBadge />;
  if (isArbitrated) return <AIArbitratedBadge />;
  if (isCommunityVerified && voteCount >= 5)
    return <CommunityVerifiedBadge voteCount={voteCount} />;
  if (isAIAnswer) return <AIInstantBadge />;
  return null;
};

AnswerTypeBadge.propTypes = {
  isAccepted: PropTypes.bool,
  isAIAnswer: PropTypes.bool,
  isArbitrated: PropTypes.bool,
  isCommunityVerified: PropTypes.bool,
  voteCount: PropTypes.number,
};

AIVerifiedBadge.propTypes = {
  className: PropTypes.string,
};

AIArbitratedBadge.propTypes = {
  className: PropTypes.string,
};

HumanAcceptedBadge.propTypes = {
  className: PropTypes.string,
};

AIInstantBadge.propTypes = {
  className: PropTypes.string,
};

CommunityVerifiedBadge.propTypes = {
  voteCount: PropTypes.number.isRequired,
  className: PropTypes.string,
};

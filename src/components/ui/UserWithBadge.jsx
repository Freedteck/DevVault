import PropTypes from "prop-types";
import { User, UserCheck, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserAcceptanceCount } from "../../hooks/useHCSData";
import styles from "./UserWithBadge.module.css";

const BADGE_TIERS = {
  HELPER: { min: 25, name: "Helper", color: "#CD7F32" }, // Bronze
  CONTRIBUTOR: { min: 100, name: "Contributor", color: "#71717a" }, // Darker Silver/Gray
  EXPERT: { min: 300, name: "Expert", color: "#d97706" }, // Darker Gold/Amber
  LEGEND: { min: 1000, name: "Legend", color: "#9333ea" }, // Purple
};

const getBadgeTier = (acceptanceCount) => {
  if (acceptanceCount >= BADGE_TIERS.LEGEND.min) return BADGE_TIERS.LEGEND;
  if (acceptanceCount >= BADGE_TIERS.EXPERT.min) return BADGE_TIERS.EXPERT;
  if (acceptanceCount >= BADGE_TIERS.CONTRIBUTOR.min)
    return BADGE_TIERS.CONTRIBUTOR;
  if (acceptanceCount >= BADGE_TIERS.HELPER.min) return BADGE_TIERS.HELPER;
  return null;
};

const UserWithBadge = ({ accountId, size = "sm" }) => {
  const { count } = useUserAcceptanceCount(accountId);
  const badge = getBadgeTier(count);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/profile/${accountId}`);
  };

  return (
    <div className={styles.userWithBadge} onClick={handleClick}>
      <div
        className={`${styles.avatar} ${badge ? styles.avatarEarned : ""}`}
        style={
          badge
            ? {
                background: `linear-gradient(135deg, ${badge.color}20 0%, ${badge.color}10 50%, ${badge.color}05 100%)`,
                borderColor: `${badge.color}50`,
                color: badge.color,
              }
            : {}
        }
      >
        {badge ? (
          <UserCheck size={size === "sm" ? 16 : 20} />
        ) : (
          <User size={size === "sm" ? 16 : 20} />
        )}
      </div>
      <span className={styles.accountId}>{accountId}</span>
      {badge && (
        <span title={badge ? `Verified ${badge.name}` : "Unverified"}>
          <CheckCircle
            size={16}
            className={styles.verifiedBadge}
            style={{ color: badge.color }}
          />
        </span>
      )}
    </div>
  );
};

UserWithBadge.propTypes = {
  accountId: PropTypes.string.isRequired,
  size: PropTypes.oneOf(["sm", "md"]),
};

export default UserWithBadge;

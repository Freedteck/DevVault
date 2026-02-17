import PropTypes from "prop-types";
import { User, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserAcceptanceCount } from "../../hooks/useHCSData";
import BadgeSVG from "../badges/BadgeSVG";
import styles from "./UserWithBadge.module.css";

const BADGE_TIERS = {
  HELPER: { min: 1, name: "Helper", color: "#CD7F32" }, // Bronze
  CONTRIBUTOR: { min: 3, name: "Contributor", color: "#71717a" }, // Silver/Gray
  EXPERT: { min: 5, name: "Expert", color: "#d97706" }, // Gold/Amber
  LEGEND: { min: 10, name: "Legend", color: "#9333ea" }, // Purple
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
        <span 
          title={`Verified ${badge.name}`}
          className={styles.badgeIcon}
        >
          <BadgeSVG tier={badge.name} color={badge.color} earned={true} />
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

import PropTypes from "prop-types";
import { Award } from "lucide-react";
import styles from "./UserBadge.module.css";

const BADGE_TIERS = {
  HELPER: { min: 25, name: "Helper", color: "#CD7F32" }, // Bronze
  CONTRIBUTOR: { min: 100, name: "Contributor", color: "#C0C0C0" }, // Silver
  EXPERT: { min: 300, name: "Expert", color: "#FFD700" }, // Gold
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

const UserBadge = ({ acceptanceCount, size = "sm" }) => {
  const badge = getBadgeTier(acceptanceCount);

  if (!badge) return null;

  return (
    <div
      className={`${styles.badge} ${styles[size]}`}
      style={{ color: badge.color }}
      title={`${badge.name} - ${acceptanceCount} accepted answers`}
    >
      <Award size={size === "sm" ? 14 : 16} fill={badge.color} />
    </div>
  );
};

UserBadge.propTypes = {
  acceptanceCount: PropTypes.number.isRequired,
  size: PropTypes.oneOf(["sm", "md"]),
};

export default UserBadge;

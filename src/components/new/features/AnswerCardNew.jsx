import { ThumbsUp, Coins, Bot } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import { getBadgeComponent } from "../ui/BadgeIcons";
import { AnswerTypeBadge } from "../ui/AnswerBadges";
import styles from "./AnswerCardNew.module.css";
import PropTypes from "prop-types";

const AnswerCardNew = ({
  answer,
  isAccepted,
  isArbitrated,
  onTip,
  onAccept,
}) => {
  const { author, content, createdAt, likes, isAI, confidence } = answer;
  const date = new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const badgeColors = {
    Legend: "#d946ef", // Fuchsia
    Expert: "#f59e0b", // Amber/Gold
    Contributor: "#94a3b8", // Slate/Silver
    Helper: "#ca8a04", // Bronze-ish
  };

  const BadgeIcon =
    author.rank && !isAI ? getBadgeComponent(author.rank) : null;
  const badgeColor = badgeColors[author.rank] || "var(--apex-primary-400)";

  return (
    <GlassCard
      className={`${styles.card} ${isAccepted ? styles.accepted : ""} ${isArbitrated ? styles.arbitrated : ""} ${isAI ? styles.aiAnswer : ""}`}
    >
      <div className={styles.header}>
        <div className={styles.author}>
          {isAI ? (
            <div className={styles.aiAvatar}>
              <Bot size={20} />
            </div>
          ) : (
            <img
              src={author.avatar}
              alt={author.username}
              className={styles.avatar}
            />
          )}
          <div className={styles.meta}>
            <div className={styles.nameRow}>
              <span className={styles.username}>{author.username}</span>
              {BadgeIcon && (
                <span
                  className={styles.badge}
                  title={`${author.rank} Tier`}
                  style={{ color: badgeColor, borderColor: badgeColor }}
                >
                  <BadgeIcon size={14} />
                </span>
              )}
            </div>
            <span className={styles.date}>{date}</span>
          </div>
        </div>
        {isAI ? (
          <div className={styles.badgeRow}>
            {isAI && confidence && (
              <span className={styles.confidenceBadge}>
                {confidence}% confidence
              </span>
            )}
          </div>
        ) : (
          <div className={styles.badgeRow}>
            <AnswerTypeBadge
              isAccepted={isAccepted}
              isAIAnswer={false}
              isArbitrated={isArbitrated}
              isCommunityVerified={false}
              voteCount={likes}
            />
          </div>
        )}
      </div>

      <div className={styles.content}>{content}</div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <button className={styles.actionBtn}>
            <ThumbsUp size={16} /> {likes}
          </button>
          <button className={styles.tipBtn} onClick={onTip}>
            <Coins size={16} /> Tip
          </button>
        </div>

        {/* Accept button (shown to question asker only) */}
        {!isAccepted && !isArbitrated && onAccept && (
          <NeonButton
            variant="outline"
            size="sm"
            className={styles.acceptBtn}
            onClick={onAccept}
          >
            Accept Answer
          </NeonButton>
        )}
      </div>
    </GlassCard>
  );
};

AnswerCardNew.propTypes = {
  answer: PropTypes.object.isRequired,
  isAccepted: PropTypes.bool,
  isArbitrated: PropTypes.bool,
  onTip: PropTypes.func,
  onAccept: PropTypes.func,
};

export default AnswerCardNew;

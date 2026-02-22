import { Coins, Bot } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import ExpandableContent from "../ui/ExpandableContent";
import { getBadgeComponent } from "../ui/BadgeIcons";
import { AnswerTypeBadge } from "../ui/AnswerBadges";
import styles from "./AnswerCardNew.module.css";
interface AnswerCardProps {
  answer: any;
  isAccepted?: boolean;
  isArbitrated?: boolean;
  onTip?: () => void;
  onAccept?: () => void;
}

const AnswerCardNew = ({
  answer,
  isAccepted,
  isArbitrated,
  onTip,
  onAccept,
}: AnswerCardProps) => {
  const { author, content, createdAt, isAI, confidence } = answer;
  const date = new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const badgeColors: any = {
    Legend: "#d946ef",
    Expert: "#f59e0b",
    Contributor: "#94a3b8",
    Helper: "#ca8a04",
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
            {confidence && (
              <span className={styles.confidenceBadge}>
                {confidence}% confidence
              </span>
            )}
            <AnswerTypeBadge
              isAccepted={isAccepted}
              isAIAnswer={true}
              isArbitrated={isArbitrated}
              isCommunityVerified={false}
            />
          </div>
        ) : (
          <div className={styles.badgeRow}>
            <AnswerTypeBadge
              isAccepted={isAccepted}
              isAIAnswer={false}
              isArbitrated={isArbitrated}
              isCommunityVerified={false}
            />
          </div>
        )}
      </div>

      <ExpandableContent
        content={content}
        maxLength={600}
        className={styles.content}
      />

      <div className={styles.footer}>
        <div className={styles.actions}>
          <button className={styles.tipBtn} onClick={onTip}>
            <Coins size={16} /> Tip
          </button>
        </div>

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

export default AnswerCardNew;

import { useNavigate } from "react-router-dom";
import { MessageSquare, Coins } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import styles from "./QuestionCardNew.module.css";
import PropTypes from "prop-types";

const QuestionCardNew = ({ question }) => {
  const navigate = useNavigate();
  const {
    sequenceNumber,
    title,
    description,
    tags,
    bounty,
    author,
    stats,
    isSolved,
    timestamp,
  } = question;

  // Format relative time
  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <GlassCard
      hoverEffect
      className={styles.card}
      onClick={() => navigate(`/questions/${sequenceNumber}`)}
    >
      <div className={styles.header}>
        <div className={styles.author}>
          <img
            src={author.avatar}
            alt={author.username}
            className={styles.avatar}
          />
          <span className={styles.username}>{author.username}</span>
          {author.rank === "Legend" && (
            <span className={styles.rankBadge}>👑</span>
          )}
        </div>
        <div className={styles.date}>{getRelativeTime(timestamp)}</div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>

        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <MessageSquare size={16} /> {stats.answers}
          </span>
        </div>

        <div className={styles.actions}>
          {bounty > 0 && (
            <span className={styles.bounty}>
              <Coins size={16} /> {bounty} HBAR
            </span>
          )}
          {isSolved && <span className={styles.solved}>Solved ✓</span>}
        </div>
      </div>
    </GlassCard>
  );
};

QuestionCardNew.propTypes = {
  question: PropTypes.object.isRequired,
};

export default QuestionCardNew;

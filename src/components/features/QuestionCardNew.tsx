"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Coins } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import styles from "./QuestionCardNew.module.css";
import { useRouter } from "next/navigation";

const QuestionCardNew = ({ question }: any) => {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  const getRelativeTime = (timestamp: any) => {
    if (!hasMounted) return "..."; // Return a placeholder during SSR/Hydration

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

  const truncateDescription = (text: string) => {
    const stripped = text.replace(/[*_`#[\]()!]/g, "").substring(0, 150);
    return stripped + (text.length > 150 ? "..." : "");
  };

  return (
    <GlassCard
      hoverEffect
      className={styles.card}
      onClick={() => router.push(`/questions/${sequenceNumber}`)}
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
        <p className={styles.description}>{truncateDescription(description)}</p>

        <div className={styles.tags}>
          {tags.map((tag: any) => (
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

export default QuestionCardNew;

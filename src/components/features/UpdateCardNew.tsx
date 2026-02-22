"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import styles from "./UpdateCardNew.module.css";
import Image from "next/image";

const UpdateCardNew = ({ update }: any) => {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    sequenceNumber,
    title,
    content,
    author,
    timestamp,
    tags = [],
  } = update;

  const getRelativeTime = (ts: any) => {
    if (!hasMounted) return "..."; // Avoid hydration mismatch

    const now = Date.now();
    const diff = now - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const truncateContent = (text: string) => {
    const stripped = text.replace(/[*_`#\[\]()!]/g, "").substring(0, 150);
    return stripped + (text.length > 150 ? "..." : "");
  };

  const description = truncateContent(content || "");

  const authorData =
    typeof author === "string"
      ? {
          username: author,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${author}`,
        }
      : author;

  return (
    <GlassCard
      hoverEffect
      className={styles.card}
      onClick={() => router.push(`/updates/${sequenceNumber}`)}
    >
      <div className={styles.header}>
        <div className={styles.author}>
          <img
            src={authorData.avatar}
            alt={authorData.username}
            className={styles.avatar}
          />
          <span className={styles.username}>{authorData.username}</span>
        </div>
        <div className={styles.date}>{getRelativeTime(timestamp)}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.banner} aria-hidden="true">
          <Image
            src={update.image || "/update-banner.svg"}
            width={300}
            height={140}
            alt="update image"
            className={styles.bannerImg}
            draggable={false}
          />
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>

        <div className={styles.tags}>
          <span className={styles.tag}>#news</span>
          {tags.map((tag: any) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span className={styles.categoryBadge}>Network Update</span>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default UpdateCardNew;

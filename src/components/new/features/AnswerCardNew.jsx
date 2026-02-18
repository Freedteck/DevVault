import React from 'react';
import { ThumbsUp, CheckCircle, Coins } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import NeonButton from '../ui/NeonButton';
import { getBadgeComponent } from '../ui/BadgeIcons';
import styles from './AnswerCardNew.module.css';

const AnswerCardNew = ({ answer, isAccepted, onTip }) => {
  const { author, content, createdAt, likes } = answer;
  const date = new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  });

  const badgeColors = {
    'Legend': '#d946ef', // Fuchsia
    'Expert': '#f59e0b', // Amber/Gold
    'Contributor': '#94a3b8', // Slate/Silver
    'Helper': '#ca8a04', // Bronze-ish
  };

  const BadgeIcon = author.rank ? getBadgeComponent(author.rank) : null;
  const badgeColor = badgeColors[author.rank] || 'var(--apex-primary-400)';

  return (
    <GlassCard className={`${styles.card} ${isAccepted ? styles.accepted : ''}`}>
      {isAccepted && (
        <div className={styles.acceptedBadge}>
          <CheckCircle size={14} /> Solved Best Answer
        </div>
      )}
      
      <div className={styles.header}>
        <div className={styles.author}>
          <img src={author.avatar} alt={author.username} className={styles.avatar} />
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
      </div>

      <div className={styles.content}>
        {content}
      </div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <button className={styles.actionBtn}>
            <ThumbsUp size={16} /> {likes}
          </button>
          <button className={styles.tipBtn} onClick={onTip}>
            <Coins size={16} /> Tip
          </button>
        </div>
        
        {/* Placeholder for "Accept" action if viewer is OP */}
        {!isAccepted && (
          <NeonButton variant="outline" size="sm" className={styles.acceptBtn}>
             Accept Answer
          </NeonButton>
        )}
      </div>
    </GlassCard>
  );
};

export default AnswerCardNew;

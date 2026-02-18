import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, Heart, Code } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import NeonButton from '../ui/NeonButton';
import styles from './QuestionCardNew.module.css';

const QuestionCardNew = ({ question }) => {
  const navigate = useNavigate();
  const { id, title, description, tags, bounty, author, stats, isSolved } = question;

  return (
    <GlassCard 
      hoverEffect 
      className={styles.card}
      onClick={() => navigate(`/questions/${id}`)}
    >
      <div className={styles.header}>
        <div className={styles.author}>
          <img src={author.avatar} alt={author.username} className={styles.avatar} />
          <span className={styles.username}>{author.username}</span>
          {author.rank === 'Legend' && <span className={styles.rankBadge}>👑</span>}
        </div>
        <div className={styles.date}>2h ago</div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        
        <div className={styles.tags}>
          {tags.map(tag => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span className={styles.stat}><Eye size={16} /> {stats.views}</span>
          <span className={styles.stat}><MessageSquare size={16} /> {stats.answers}</span>
          <span className={`${styles.stat} ${styles.likes}`}><Heart size={16} /> {stats.likes}</span>
        </div>

        <div className={styles.actions}>
          {bounty > 0 && (
            <span className={styles.bounty}>
              <span className={styles.bountyIcon}>💎</span> {bounty} HBAR
            </span>
          )}
          {isSolved && (
            <span className={styles.solved}>
              Solved ✓
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default QuestionCardNew;

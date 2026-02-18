import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Share2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import styles from './UpdateCardNew.module.css';

const UpdateCardNew = ({ update }) => {
  const navigate = useNavigate();
  const { updateId, title, content, tags, author, createdAt, timestamp } = update;
  
  // Use timestamp if available, otherwise createdAt
  const dateValue = timestamp || createdAt;
  const date = new Date(dateValue).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Truncate content for preview
  const description = content?.substring(0, 150) + (content?.length > 150 ? '...' : '');

  // Handle author format (could be string or object)
  const authorData = typeof author === 'string' 
    ? { username: author, avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${author}` }
    : author;

  return (
    <GlassCard 
      hoverEffect 
      className={styles.card}
      onClick={() => navigate(`/updates/${updateId}`)}
    >
      <div className={styles.metaRow}>
        <div className={styles.categoryBadge}>
          News
        </div>
        <span className={styles.date}>
          <Calendar size={14} /> {date}
        </span>
      </div>

      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      <div className={styles.footer}>
        <div className={styles.author}>
          <img src={authorData.avatar} alt={authorData.username} className={styles.avatar} />
          <span className={styles.username}>{authorData.username}</span>
        </div>

        <div className={styles.actions}>
           <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); /* Logic for share */ }}>
             <Share2 size={16} />
           </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default UpdateCardNew;

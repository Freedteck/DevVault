import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Heart, Share2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import styles from './UpdateCardNew.module.css';

const UpdateCardNew = ({ update }) => {
  const navigate = useNavigate();
  const { id, title, description, tags, author, createdAt, likes } = update;
  const date = new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <GlassCard 
      hoverEffect 
      className={styles.card}
      onClick={() => navigate(`/updates/${id}`)}
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
          <img src={author.avatar} alt={author.username} className={styles.avatar} />
          <span className={styles.username}>{author.username}</span>
        </div>

        <div className={styles.actions}>
           <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); /* Logic for like */ }}>
             <Heart size={16} /> {likes}
           </button>
           <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); /* Logic for share */ }}>
             <Share2 size={16} />
           </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default UpdateCardNew;

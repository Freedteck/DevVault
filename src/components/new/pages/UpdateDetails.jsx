import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MessageCircle, Share2, Coins, Send, Newspaper } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import NeonButton from '../ui/NeonButton';
import AnswerCardNew from '../features/AnswerCardNew'; // Reusing for comments style
import TipModal from '../features/TipModal';
import { MOCK_UPDATES, MOCK_USERS } from '../data/mock';
import styles from './QuestionDetails.module.css'; // Reusing layout styles

const UpdateDetailsNew = () => {
  const { id } = useParams();
  const update = MOCK_UPDATES.find(u => u.id === id) || MOCK_UPDATES[0];
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState(null);

  // Mock comments using reusing Answer structure
  const comments = [
    {
      id: 201,
      author: MOCK_USERS.users[1],
      content: "This is huge for the ecosystem! Can't wait to see the implementation.",
      createdAt: "2024-02-15T10:00:00Z",
      likes: 8,
      isAccepted: false
    }
  ];

  const handleOpenTip = (authorName) => {
    setTipTarget(authorName);
    setIsTipModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <Link to="/updates" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to News
      </Link>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <GlassCard className={styles.questionCard}>
            <div className={styles.meta}>
               <span className={styles.tag} style={{background: 'var(--apex-primary-500)', color:'white'}}>News</span>
            </div>
            
            <h1 className={styles.title}>{update.title}</h1>
            
            <div className={styles.meta} style={{borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px'}}>
              <div className={styles.author}>
                <img src={update.author.avatar} alt={update.author.username} className={styles.avatar} />
                <span className={styles.username}>{update.author.username}</span>
              </div>
              <span className={styles.dot}>•</span>
              <span className={styles.date}>
                <Calendar size={14} /> {new Date(update.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className={styles.description} style={{fontSize: '1.1rem'}}>{update.description}</p>

            <div className={styles.bountyBar} style={{background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--glass-border)'}}>
              <div className={styles.author} style={{gap: '16px'}}>
                 <button className={styles.actionBtn} onClick={() => handleOpenTip(update.author.username)}>
                    <Coins size={18} /> Tip Author
                 </button>
                 <button className={styles.actionBtn}>
                    <Share2 size={18} /> Share
                 </button>
              </div>
            </div>
          </GlassCard>

          <div className={styles.divider} />

          <h3 className={styles.sectionTitle}>Comments</h3>
          
          <div className={styles.answersList}>
            {comments.map(comment => (
              <AnswerCardNew 
                key={comment.id} 
                answer={comment} 
                onTip={() => handleOpenTip(comment.author.username)}
              />
            ))}
          </div>

          <GlassCard className={styles.postArea}>
            <h3 className={styles.postTitle}>Leave a Comment</h3>
            <textarea 
              className={styles.textarea} 
              placeholder="Join the discussion..." 
              rows={4}
            />
            <div className={styles.postActions}>
              <NeonButton icon={<Send size={16} />}>
                Post Comment
              </NeonButton>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <GlassCard className={styles.sidebarCard}>
             <h4 style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
               <Newspaper size={16} /> Trending Updates
             </h4>
             <ul className={styles.linkList}>
               <li><a href="#">Hedera Governing Council adds new member</a></li>
               <li><a href="#">Mirror Node v0.90 released</a></li>
               <li><a href="#">SaucerSwap V2 audit complete</a></li>
             </ul>
          </GlassCard>
        </aside>
      </div>

       {/* Tip Modal */}
       <TipModal 
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          targetName={tipTarget}
          onConfirm={(amount) => {
            import('react-hot-toast').then(({ default: toast }) => {
               toast.success(`Successfully sent ${amount} HBAR to ${tipTarget}`);
            });
            setIsTipModalOpen(false);
          }}
       />
    </div>
  );
};

export default UpdateDetailsNew;

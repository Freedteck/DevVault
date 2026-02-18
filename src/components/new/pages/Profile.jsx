import React from 'react';
import { User, Shield, Zap, Gift, Trophy } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import NeonButton from '../ui/NeonButton';
import { HelperBadge, ContributorBadge, ExpertBadge, LegendBadge, getBadgeComponent } from '../ui/BadgeIcons';
import { MOCK_USERS } from '../data/mock';
import styles from './Profile.module.css';

const ProfileNew = () => {
  const user = MOCK_USERS.currentUser;
  
  // Logic to determine current badge component
  const CurrentBadgeIcon = getBadgeComponent(user.reputation.tier);

  return (
    <div className={styles.container}>
      {/* Profile Header */}
      <GlassCard className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div className={styles.avatarWrapper}>
            <img src={user.avatar} alt={user.username} className={styles.avatar} />
            <div className={styles.statusIndicator} />
          </div>
          
          <div className={styles.userInfo}>
             <h1 className={styles.username}>{user.username}</h1>
             
             <div className={styles.badges}>
               {/* Primary Rank Badge */}
               <div className={`${styles.rankBadge} ${styles[user.reputation.tier.toLowerCase()]}`}>
                  {CurrentBadgeIcon && <CurrentBadgeIcon size={16} />} 
                  <span>{user.reputation.tier}</span>
               </div>
               
               {/* Other Badges */}
               {user.badges.map(b => (
                 <span key={b} className={styles.badge}>
                   <Shield size={14} /> {b}
                 </span>
               ))}
             </div>
          </div>

          <div className={styles.statsGrid}>
             <div className={styles.statBox}>
                <span className={styles.statLabel}>Wallet Balance</span>
                <span className={styles.statValue}>
                  {user.balance} <span className={styles.unit}>HBAR</span>
                </span>
             </div>
             <div className={styles.statBox}>
                <span className={styles.statLabel}>Reputation</span>
                <span className={styles.statValue}>
                  {user.reputation.acceptanceCount} <span className={styles.unit}>Accepted</span>
                </span>
             </div>
          </div>
        </div>
      </GlassCard>

      <div className={styles.contentGrid}>
        {/* Left Column: Reputation Breakdown */}
        <div className={styles.leftCol}>
          <GlassCard title="Reputation Status">
             <div className={styles.reputationHeader}>
               <h3 className={styles.cardTitle}><Trophy size={18}/> Current Standings</h3>
             </div>
             
             <div className={styles.reputationCard}>
                <div className={styles.currentTier}>
                   <div className={styles.largeIcon}>
                      {CurrentBadgeIcon && <CurrentBadgeIcon size={48} />}
                   </div>
                   <div className={styles.tierInfo}>
                      <h4>{user.reputation.tier} Tier</h4>
                      <p>Top {user.reputation.score > 500 ? '1%' : '10%'} contributor</p>
                   </div>
                </div>

                <div className={styles.progressSection}>
                   <div className={styles.progressLabel}>
                      <span>Progress to Next Tier</span>
                      <span>{user.reputation.acceptanceCount} / 50</span>
                   </div>
                   <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{width: '84%'}} />
                   </div>
                </div>
             </div>

             <div className={styles.achievementList}>
                <div className={styles.achievementItem}>
                   <div className={`${styles.iconBox} ${styles.unlocked}`}>
                      <Zap size={20} />
                   </div>
                   <div className={styles.achievementInfo}>
                      <span className={styles.achTitle}>First Answer</span>
                      <span className={styles.achDesc}>Solved 1 question</span>
                   </div>
                </div>
                {/* Locked Item */}
                <div className={styles.achievementItem}>
                   <div className={styles.iconBox}>
                      <Gift size={20} />
                   </div>
                   <div className={styles.achievementInfo}>
                      <span className={styles.achTitle}>Big Tipper</span>
                      <span className={styles.achDesc}>Tip 1000 HBAR total</span>
                   </div>
                </div>
             </div>
          </GlassCard>
        </div>

        {/* Right Column: Key History */}
        <div className={styles.rightCol}>
           <GlassCard>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
              <div className={styles.activityList}>
                 <div className={styles.activityItem}>
                    <span className={styles.activityIcon}>✅</span>
                    <div className={styles.activityContent}>
                       <span className={styles.activityText}>Solved <strong>HTS Token Issue</strong></span>
                       <span className={styles.activityTime}>2 hours ago</span>
                    </div>
                    <span className={styles.activityReward}>+50 HBAR Bounty</span>
                 </div>
                 
                 <div className={styles.activityItem}>
                    <span className={styles.activityIcon}>💎</span>
                    <div className={styles.activityContent}>
                       <span className={styles.activityText}>Received Tip from <strong>solidity_sage</strong></span>
                       <span className={styles.activityTime}>5 hours ago</span>
                    </div>
                    <span className={styles.activityReward}>+10 HBAR</span>
                 </div>

                 <div className={styles.activityItem}>
                    <span className={styles.activityIcon}>❓</span>
                    <div className={styles.activityContent}>
                       <span className={styles.activityText}>Asked <strong>Smart Contract Upgrade...</strong></span>
                       <span className={styles.activityTime}>1 day ago</span>
                    </div>
                 </div>
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ProfileNew;

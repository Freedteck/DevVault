"use client";

import GlassCard from "../ui/GlassCard";
import Skeleton from "../ui/Skeleton";
import profileStyles from "../pages/Profile.module.css";

const ProfileSkeleton = () => {
  return (
    <div className={profileStyles.container}>
      {/* Header Skeleton */}
      <GlassCard className={profileStyles.headerCard}>
        <div className={profileStyles.profileHeader}>
          <div className={profileStyles.avatarSection}>
            <Skeleton
              borderRadius="50%"
              width={96}
              height={96}
              className={profileStyles.avatar}
            />
            <Skeleton width={80} height={28} borderRadius="20px" />
          </div>

          <div className={profileStyles.userInfo}>
            <div style={{ marginBottom: "12px" }}>
              <Skeleton width="40%" height={32} />
            </div>
            <div className={profileStyles.balanceInfo}>
              <Skeleton width="120px" height={28} />
              <div style={{ marginTop: "4px" }}>
                <Skeleton width="80px" height={16} />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid Skeleton */}
      <div className={profileStyles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i}>
            <div className={profileStyles.statCard}>
              <Skeleton width={48} height={48} borderRadius="12px" />
              <div className={profileStyles.statContent}>
                <Skeleton width={40} height={32} />
                <div style={{ marginTop: "4px" }}>
                  <Skeleton width={100} height={16} />
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Activity Skeleton */}
      <GlassCard>
        <div className={profileStyles.sectionTitle}>
          <Skeleton width={150} height={24} />
        </div>
        <div className={profileStyles.activityList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={profileStyles.activityItem}>
              <Skeleton width={40} height={40} borderRadius="8px" />
              <div className={profileStyles.activityContent}>
                <Skeleton width="60%" height={18} />
                <div style={{ marginTop: "4px" }}>
                  <Skeleton width="80px" height={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileSkeleton;

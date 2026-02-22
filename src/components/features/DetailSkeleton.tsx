import "react";
import Skeleton from "../ui/Skeleton";
import GlassCard from "../ui/GlassCard";
import styles from "../../components/pages/QuestionDetails.module.css";

const DetailSkeleton = () => {
  return (
    <div className={styles.container}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Skeleton width="120px" height="1rem" />
      </div>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <GlassCard className={styles.questionCard}>
            <Skeleton width="80%" height="2.5rem" />
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem",
                alignItems: "center",
              }}
            >
              <Skeleton width="32px" height="32px" borderRadius="50%" />
              <Skeleton width="120px" height="1rem" />
              <Skeleton width="80px" height="1rem" />
            </div>

            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <Skeleton width="100%" height="1.2rem" />
              <Skeleton width="95%" height="1.2rem" />
              <Skeleton width="90%" height="1.2rem" />
              <Skeleton width="40%" height="1.2rem" />
            </div>

            <div style={{ marginTop: "2rem" }}>
              <Skeleton width="100%" height="3rem" borderRadius="0.5rem" />
            </div>
          </GlassCard>

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <Skeleton width="150px" height="1.8rem" />
            {[1, 2].map((i) => (
              <GlassCard key={i} style={{ padding: "1.5rem" }}>
                <div
                  style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                >
                  <Skeleton width="40px" height="40px" borderRadius="50%" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="100px" height="1rem" />
                    <div style={{ marginTop: "0.4rem" }}>
                      <Skeleton width="60px" height="0.6rem" />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <Skeleton width="100%" height="1rem" />
                  <div style={{ marginTop: "0.5rem" }}>
                    <Skeleton width="80%" height="1rem" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <GlassCard style={{ padding: "1.5rem" }}>
            <Skeleton width="120px" height="1.2rem" />
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <Skeleton width="60px" height="0.8rem" />
              <Skeleton width="80px" height="0.8rem" />
              <Skeleton width="70px" height="0.8rem" />
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
};

export default DetailSkeleton;

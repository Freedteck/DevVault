
import Skeleton from "../ui/Skeleton";
import GlassCard from "../ui/GlassCard";
import styles from "../../app/questions/questions.module.css";

const QuestionSkeleton = () => {
  return (
    <GlassCard className={styles.questionCard} style={{ cursor: "default" }}>
      <div className={styles.header}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            width: "100%",
          }}
        >
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="120px" height="1rem" />
            <div style={{ marginTop: "0.4rem" }}>
              <Skeleton width="80px" height="0.6rem" />
            </div>
          </div>
          <Skeleton width="100px" height="1.5rem" borderRadius="1rem" />
        </div>
      </div>

      <div className={styles.content} style={{ marginTop: "1rem" }}>
        <Skeleton width="90%" height="1.2rem" />
        <div style={{ marginTop: "0.5rem" }}>
          <Skeleton width="100%" height="0.8rem" />
          <div style={{ marginTop: "0.3rem" }}>
            <Skeleton width="60%" height="0.8rem" />
          </div>
        </div>
      </div>

      <div
        className={styles.footer}
        style={{
          marginTop: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem" }}>
          <Skeleton width="60px" height="1rem" />
          <Skeleton width="60px" height="1rem" />
        </div>
      </div>
    </GlassCard>
  );
};

export default QuestionSkeleton;

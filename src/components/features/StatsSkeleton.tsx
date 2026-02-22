import React from "react";
import Skeleton from "../ui/Skeleton";
import styles from "../../app/home.module.css";

const StatsSkeleton = () => {
  return (
    <div
      className={styles.statsBar}
      style={{ border: "none", background: "transparent" }}
    >
      {[1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <div className={styles.statItem} style={{ gap: "0.5rem" }}>
            <Skeleton width="60px" height="2.5rem" />
            <Skeleton width="100px" height="0.8rem" />
          </div>
          {i < 3 && <div className={styles.divider} />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StatsSkeleton;

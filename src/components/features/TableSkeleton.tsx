import Skeleton from "../ui/Skeleton";
import styles from "../../components/pages/Leaderboard.module.css";

const TableSkeleton = () => {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.rankCol}>Rank</th>
          <th>Developer</th>
          <th>Reputation</th>
          <th className={styles.scoreCol}>Score</th>
        </tr>
      </thead>
      <tbody>
        {[1, 2, 3, 4, 5].map((i) => (
          <tr key={i} className={styles.row}>
            <td className={styles.rankCol}>
              <Skeleton width="24px" height="24px" borderRadius="50%" />
            </td>
            <td>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <Skeleton width="32px" height="32px" borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="100px" height="1rem" />
                  <div style={{ marginTop: "0.4rem" }}>
                    <Skeleton width="60px" height="0.6rem" />
                  </div>
                </div>
              </div>
            </td>
            <td>
              <Skeleton width="100%" height="8px" borderRadius="10px" />
            </td>
            <td className={styles.scoreCol}>
              <Skeleton width="60px" height="1.2rem" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableSkeleton;

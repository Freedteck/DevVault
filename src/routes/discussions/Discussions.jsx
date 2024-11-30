import { NavLink, Outlet } from "react-router-dom";
import styles from "./Discussions.module.css";

const Discussions = () => {
  return (
    <main className={styles.discussions}>
      <nav>
        <NavLink
          to="/discussions"
          end
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          Ask & Build
        </NavLink>
        <NavLink
          to="updates"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          Updates
        </NavLink>
      </nav>
      <Outlet />
    </main>
  );
};

export default Discussions;

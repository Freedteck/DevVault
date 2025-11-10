import { Outlet, NavLink } from "react-router-dom";
import { MessageSquare, Newspaper } from "lucide-react";
import styles from "./Discussions.module.css";

const Discussions = () => {
  return (
    <div className={styles.discussions}>
      <div className={styles.container}>
        {/* Tab Navigation */}
        <nav className={styles.tabs}>
          <NavLink
            to="/discussions"
            end
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.active : ""}`
            }
          >
            <MessageSquare size={20} />
            <span>Questions & Answers</span>
          </NavLink>
          <NavLink
            to="/discussions/updates"
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.active : ""}`
            }
          >
            <Newspaper size={20} />
            <span>Updates & News</span>
          </NavLink>
        </nav>

        {/* Content Area */}
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Discussions;

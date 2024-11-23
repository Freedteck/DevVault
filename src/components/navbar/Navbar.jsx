import { Link, NavLink } from "react-router-dom";
import Button from "../button/Button";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <header>
      <nav className={styles.headerNav}>
        <Link to={"/"} className={styles.logo}>
          DevVault
        </Link>
        <div className={styles.navLinks}>
          <ul>
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="QandA"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Q & A
              </NavLink>
            </li>
            <li>
              <NavLink
                to="profile"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                profile
              </NavLink>
            </li>
            <li>
              <NavLink
                to="updates"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Updates
              </NavLink>
            </li>
            <li>
              <NavLink
                to="leaderboard"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Leaderboard
              </NavLink>
            </li>
          </ul>
          <Button text={"Connect"} />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

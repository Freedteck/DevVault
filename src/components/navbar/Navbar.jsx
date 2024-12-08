import { Link, NavLink } from "react-router-dom";
import Button from "../button/Button";
import styles from "./Navbar.module.css";
import { useContext } from "react";
import { userWalletContext } from "../../context/userWalletContext";

const Navbar = () => {
  const { accountId, connectWallet } = useContext(userWalletContext);
  return (
    <header>
      <nav className={styles.headerNav}>
        <Link to={"/"} className={styles.logo}>
          DeVault
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
                to="discussions"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Discussions
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
                to="leaderboard"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Leaderboard
              </NavLink>
            </li>
          </ul>
          {accountId ? (
            <Button text={accountId} />
          ) : (
            <Button text={"Connect"} handleClick={connectWallet} />
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

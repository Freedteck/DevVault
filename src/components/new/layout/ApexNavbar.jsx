import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { Wallet, Menu, Search, Bot } from "lucide-react";
import NeonButton from "../ui/NeonButton";
import styles from "./ApexNavbar.module.css";
import { userWalletContext } from "../../../context/userWalletContext";

const ApexNavbar = () => {
  const { accountId, connectWallet } = useContext(userWalletContext);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
          </div>
          <span className={styles.logoText}>
            DevVault<span className={styles.pro}>APEX</span>
          </span>
        </div>

        {/* Center Nav */}
        <div className={styles.navLinks}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/questions"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            Questions
          </NavLink>
          <NavLink
            to="/updates"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            Updates
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            Leaderboard
          </NavLink>
          <NavLink
            to="/ai-agent"
            className={({ isActive }) =>
              `${styles.link} ${styles.aiLink} ${isActive ? styles.active : ""}`
            }
          >
            <Bot size={16} /> AI Agent
          </NavLink>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.iconBtn}>
            <Search size={20} />
          </button>

          {accountId ? (
            <NavLink to="/profile" style={{ textDecoration: "none" }}>
              <NeonButton
                variant="outline"
                size="sm"
                icon={<Wallet size={16} />}
              >
                {accountId}
              </NeonButton>
            </NavLink>
          ) : (
            <NeonButton
              variant="outline"
              size="sm"
              icon={<Wallet size={16} />}
              onClick={connectWallet}
            >
              Connect Wallet
            </NeonButton>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ApexNavbar;

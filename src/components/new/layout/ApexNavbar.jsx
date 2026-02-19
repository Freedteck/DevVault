import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { Wallet, Search, LogOut } from "lucide-react";
import NeonButton from "../ui/NeonButton";
import styles from "./ApexNavbar.module.css";
import { userWalletContext } from "../../../context/userWalletContext";

const ApexNavbar = () => {
  const { accountId, connectWallet, disconnectWallet } =
    useContext(userWalletContext);
  const [showDropdown, setShowDropdown] = useState(false);

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
            to="/agent"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            AI Agent
          </NavLink>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.iconBtn}>
            <Search size={20} />
          </button>

          {accountId ? (
            <div style={{ position: "relative" }}>
              <NeonButton
                variant="outline"
                size="sm"
                icon={<Wallet size={16} />}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {accountId}
              </NeonButton>
              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "0.5rem",
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    minWidth: "200px",
                    zIndex: 1000,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <NavLink
                    to="/profile"
                    style={{ textDecoration: "none" }}
                    onClick={() => setShowDropdown(false)}
                  >
                    <div
                      style={{
                        padding: "0.5rem",
                        color: "white",
                        cursor: "pointer",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Wallet size={16} />
                      View Profile
                    </div>
                  </NavLink>
                  <div
                    style={{
                      padding: "0.5rem",
                      color: "#ef4444",
                      cursor: "pointer",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                    onClick={() => {
                      disconnectWallet();
                      setShowDropdown(false);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239, 68, 68, 0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <LogOut size={16} />
                    Disconnect
                  </div>
                </div>
              )}
            </div>
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

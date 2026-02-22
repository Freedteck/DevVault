"use client";

import { useContext, useState } from "react";
import { Wallet, Search, LogOut } from "lucide-react";
import NeonButton from "../ui/NeonButton";
import styles from "./Navbar.module.css";
import { userWalletContext } from "../../context/userWalletContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { accountId, connectWallet, disconnectWallet } =
    useContext(userWalletContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();

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
          <Link
            href="/"
            className={`${styles.link} ${pathname === "/" ? styles.active : ""}`}
          >
            Dashboard
          </Link>
          <Link
            href="/questions"
            className={`${styles.link} ${pathname === "/questions" ? styles.active : ""}`}
          >
            Questions
          </Link>
          <Link
            href="/updates"
            className={`${styles.link} ${pathname === "/updates" ? styles.active : ""}`}
          >
            Updates
          </Link>
          <Link
            href="/leaderboard"
            className={`${styles.link} ${pathname === "/leaderboard" ? styles.active : ""}`}
          >
            Leaderboard
          </Link>
          <Link
            href="/agent"
            className={`${styles.link} ${pathname === "/agent" ? styles.active : ""}`}
          >
            AI Agent
          </Link>
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
                  <Link
                    href="/profile"
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
                  </Link>
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

export default Navbar;

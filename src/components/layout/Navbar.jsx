import { Link, NavLink } from "react-router-dom";
import { useContext } from "react";
import { Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { userWalletContext } from "../../context/userWalletContext";
import Button from "../ui/Button";
import DevVaultLogo from "../ui/DevVaultLogo";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { accountId, connectWallet, balance } = useContext(userWalletContext);

  const navigation = [
    { name: "Home", path: "/" },
    { name: "Discussions", path: "/discussions" },
    { name: "Leaderboard", path: "/leaderboard" },
    ...(accountId ? [{ name: "Profile", path: `/profile/${accountId}` }] : []),
  ];

  const formatAccountId = (id) => {
    if (!id) return "";
    return id;
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <DevVaultLogo size="medium" showText={true} />
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <ul className={styles.navList}>
            {navigation.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ""}`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            {balance && (
              <div className={styles.balance}>
                <span className={styles.balanceLabel}>Balance:</span>
                <span className={styles.balanceValue}>{balance}</span>
              </div>
            )}

            {accountId ? (
              <Button variant="outline" size="sm">
                <Wallet size={16} />
                {formatAccountId(accountId)}
              </Button>
            ) : (
              <Button onClick={connectWallet} size="sm">
                <Wallet size={16} />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <ul className={styles.mobileNavList}>
            {navigation.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.active : ""}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className={styles.mobileActions}>
            {balance && (
              <div className={styles.mobileBalance}>
                <span className={styles.balanceLabel}>Balance:</span>
                <span className={styles.balanceValue}>{balance}</span>
              </div>
            )}

            {accountId ? (
              <Button variant="outline" size="md" fullWidth>
                <Wallet size={16} />
                {formatAccountId(accountId)}
              </Button>
            ) : (
              <Button onClick={connectWallet} size="md" fullWidth>
                <Wallet size={16} />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

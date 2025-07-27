import { Link, NavLink } from "react-router-dom";
import Button from "../button/Button";
import styles from "./Navbar.module.css";
import { useContext, useState } from "react";
import { userWalletContext } from "../../context/userWalletContext";
import FeedbackModal from "../feedback/FeedbackModal";
import { MessageSquare } from "lucide-react";

const Navbar = () => {
  const { accountId, connectWallet, balance } = useContext(userWalletContext);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
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
                to="leaderboard"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Leaderboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="analytics"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Analytics
              </NavLink>
            </li>
            <li>
              <NavLink
                to="gtm"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                GTM Strategy
              </NavLink>
            </li>
            <li>
              <NavLink
                to="llm-training"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                AI Training
              </NavLink>
            </li>
            <li>
              <NavLink
                to="profile"
                className={({ isActive }) =>
                  isActive ? `${styles.active}` : ""
                }
              >
                Profile
              </NavLink>
            </li>
          </ul>

          <div className={styles.right}>
            <button 
              className={styles.feedbackBtn}
              onClick={() => setShowFeedback(true)}
            >
              <MessageSquare size={16} />
              Feedback
            </button>
            {balance && (
              <div className={styles.balance}>
                <span>{balance}</span>
              </div>
            )}
            {accountId ? (
              <Button text={accountId} />
            ) : (
              <Button text={"Connect"} handleClick={connectWallet} />
            )}
          </div>
        </div>
      </nav>
      </header>
      
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </>
  );
};

export default Navbar;

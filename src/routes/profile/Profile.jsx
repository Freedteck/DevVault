import { UserCircle2 } from "lucide-react";
import styles from "./Profile.module.css";
import Button from "../../components/button/Button";
import { useContext, useEffect, useState } from "react";
import { userWalletContext } from "../../context/userWalletContext";
import tokenBalanceFcn from "../../client/tokenBalance";

const Profile = () => {
  const tokenId = import.meta.env.VITE_TOKEN_ID;
  const { accountId, balance } = useContext(userWalletContext);
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    if (accountId) {
      (async () => {
        try {
          const balance = await tokenBalanceFcn(accountId, tokenId);
          setTokenBalance(balance);
        } catch (error) {
          console.error("Error fetching token balance:", error);
        }
      })();
    }
  }, [accountId, tokenId]);

  return (
    <div className={styles.profile}>
      <div className={styles["profile-header"]}>
        <div className={styles.card}>
          <UserCircle2 size={50} />
          <p>{accountId}</p>
        </div>
        <div className={styles.card}>
          Token Balance:
          <p>
            {tokenBalance} <span>DVT</span>
          </p>
        </div>

        <div className={styles.card}>
          Account Balance:
          <p>{balance}</p>
          <Button text="Transfer Hbar" />
        </div>
      </div>
    </div>
  );
};

export default Profile;

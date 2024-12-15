import { UserCircle2 } from "lucide-react";
import styles from "./Profile.module.css";
import Button from "../../components/button/Button";
import { useContext, useEffect, useState } from "react";
import { userWalletContext } from "../../context/userWalletContext";
import tokenBalanceFcn from "../../client/tokenBalance";
import Card from "../../components/card/Card";
import SendModal from "../../components/modal/SendModal";

const Profile = () => {
  const tokenId = import.meta.env.VITE_TOKEN_ID;
  const topicId = import.meta.env.VITE_TOPIC_ID;
  const { accountId, balance } = useContext(userWalletContext);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [contribution, setContribution] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    const fetchAllDiscussions = async () => {
      await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
      )
        .then((response) => response.json())
        .then((data) => {
          const messages = data.messages.map((message) => {
            const decodedMessage = atob(message.message); // decode base64
            return JSON.parse(decodedMessage); // parse JSON
          });
          const messagesWithId = messages.map((message, index) => {
            return { ...message, id: index + 1 };
          });
          setContribution(
            messagesWithId.filter((message) => message.accountId === accountId)
          );
        })
        .catch((error) => {
          console.log(error);
        });
    };

    fetchAllDiscussions();
  }, [topicId, accountId]);

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

  const handleShowSendModal = () => {
    setShowSendModal(true);
  };

  if (!accountId) {
    return (
      <div className={styles.profile} style={{ textAlign: "center" }}>
        Please connect to HashPack wallet
      </div>
    );
  }

  return (
    <div className={styles.profile}>
      <div className={styles["profile-header"]}>
        <div className={`${styles.card} ${styles.user}`}>
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
          <Button text="Transfer Hbar" handleClick={handleShowSendModal} />
        </div>
      </div>
      <div className={styles.contribution}>
        <h2>Contributions</h2>
        {contribution.length === 0 ? (
          <p>No contributions yet</p>
        ) : (
          <ul className={styles.row}>
            {contribution.map((trend, index) => (
              <Card key={index} data={trend} type="secondary" showActions />
            ))}
          </ul>
        )}
      </div>

      {showSendModal && (
        <SendModal handleClose={() => setShowSendModal(false)} />
      )}
    </div>
  );
};

export default Profile;

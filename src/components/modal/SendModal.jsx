import { useContext, useState } from "react";
import styles from "./SendModal.module.css";
import Button from "../button/Button";
import { userWalletContext } from "../../context/userWalletContext";
import hbarTransfer from "../../client/hbarTransfer";
import PropTypes from "prop-types";

const SendModal = ({ handleClose }) => {
  const [amount, setAmount] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const { accountId, walletData } = useContext(userWalletContext);

  const handleSend = async () => {
    if (amount.trim() === "") return;
    if (!accountId) {
      alert("Please connect to HashPack wallet");
      return;
    } else {
      const [status, txtId] = await hbarTransfer(
        walletData,
        accountId,
        receiverId,
        amount
      );
      if (status === "SUCCESS") {
        console.log(status, txtId);
      }

      handleClose();
    }
  };

  return (
    <div
      className={styles.bg}
      onClick={(e) => e.target.className.includes("bg") && handleClose()}
    >
      <div className={styles.modal}>
        <h2>Send Hbar</h2>
        <label className={styles.label}>
          <input
            type="text"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            placeholder="Enter receiver ID"
          />
        </label>
        <label className={styles.label}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
          <Button text="Send" handleClick={handleSend} />
        </label>
      </div>
    </div>
  );
};

SendModal.propTypes = {
  handleClose: PropTypes.func,
};

export default SendModal;

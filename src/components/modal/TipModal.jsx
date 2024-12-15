import { useState } from "react";
import styles from "./TipModal.module.css";
import PropTypes from "prop-types";
import Button from "../button/Button";
import tokenTransferFcn from "../../client/tokenTransfer";

const TipModal = ({ userId, walletData, tokenId, accountId, handleClose }) => {
  const [tipAmount, setTipAmount] = useState("");

  const handleTip = async () => {
    if (tipAmount.trim() === "") return;
    if (!accountId) {
      alert("Please connect to HashPack wallet");
      return;
    } else {
      const [status, txtId] = await tokenTransferFcn(
        walletData,
        accountId,
        userId,
        tipAmount,
        tokenId
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
        <h2>Send Tip to {userId}</h2>
        <label className={styles.label}>
          <input
            type="number"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            placeholder="Enter tip amount"
          />
          <Button text="Tip" handleClick={handleTip} />
        </label>
      </div>
    </div>
  );
};

TipModal.propTypes = {
  accountId: PropTypes.string,
  tokenId: PropTypes.string,
  userId: PropTypes.string,
  walletData: PropTypes.any,
  handleClose: PropTypes.func,
};

export default TipModal;

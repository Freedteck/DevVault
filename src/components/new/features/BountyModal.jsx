import { useState } from "react";
import Modal from "../ui/Modal";
import NeonButton from "../ui/NeonButton";
import { Sparkles } from "lucide-react";
import styles from "./BountyModal.module.css";
import PropTypes from "prop-types";

/**
 * BountyModal - Modal for adding bounty to question
 * Opens when AI determines question needs human expert
 */
const BountyModal = ({ isOpen, onClose, onConfirm }) => {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePreset = (val) => {
    setAmount(val.toString());
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(amount) || Number(amount) < 10) return;

    setIsLoading(true);
    // Mimic bounty posting delay
    setTimeout(() => {
      onConfirm(amount);
      setIsLoading(false);
      setAmount("");
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💎 Add Bounty">
      <div className={styles.container}>
        <p className={styles.description}>
          Adding a bounty attracts expert developers to solve your complex
          problem. The bounty will be held in escrow and automatically released
          when you accept an answer.
        </p>

        <div className={styles.inputWrapper}>
          <span className={styles.currencyPrefix}>HBAR</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.input}
            placeholder="0.00"
            min="10"
            step="10"
            autoFocus
          />
        </div>

        <div className={styles.presets}>
          <span className={styles.presetLabel}>Quick amounts:</span>
          {[50, 100, 250, 500].map((val) => (
            <button
              key={val}
              className={styles.presetBtn}
              onClick={() => handlePreset(val)}
            >
              {val} ℏ
            </button>
          ))}
        </div>

        <div className={styles.info}>
          <p>ℹ️ Minimum bounty: 10 HBAR</p>
          <p>
            ⚡ If no answer is accepted within 7 days, AI arbiter will
            automatically release bounty to the best answer
          </p>
        </div>

        <div className={styles.actions}>
          <NeonButton
            onClick={handleSubmit}
            disabled={!amount || Number(amount) < 10 || isLoading}
            icon={isLoading ? null : <Sparkles size={16} />}
            fullWidth
          >
            {isLoading
              ? "Posting..."
              : `Post Question with ${amount || "0"} HBAR Bounty`}
          </NeonButton>
        </div>
      </div>
    </Modal>
  );
};

BountyModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default BountyModal;

import { useState } from "react";
import Modal from "../ui/Modal";
import NeonButton from "../ui/NeonButton";
import { Send } from "lucide-react";
import styles from "./TipModal.module.css";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  onConfirm: (amount: string) => Promise<void>;
}

const TipModal = ({
  isOpen,
  onClose,
  targetName,
  onConfirm,
}: TipModalProps) => {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePreset = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setIsLoading(true);
    try {
      await onConfirm(amount);
    } catch (error) {
      console.error("Tip error:", error);
    } finally {
      setIsLoading(false);
      setAmount("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tip ${targetName}`}>
      <div className={styles.container}>
        <p className={styles.description}>
          Support <strong>{targetName}</strong> with HBAR. Your tip goes
          directly to their wallet.
        </p>

        <div className={styles.inputWrapper}>
          <span className={styles.currencyPrefix}>HBAR</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount((e.target as any).value)}
            className={styles.input}
            placeholder="0.00"
            min="0.1"
            step="0.1"
            autoFocus
          />
        </div>

        <div className={styles.presets}>
          {[10, 50, 100].map((val) => (
            <button
              key={val}
              className={styles.presetBtn}
              onClick={() => handlePreset(val)}
            >
              {val} ℏ
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <NeonButton
            onClick={handleSubmit}
            disabled={!amount || isLoading}
            icon={isLoading ? null : <Send size={16} />}
            fullWidth
          >
            {isLoading
              ? "Sending..."
              : `Send ${amount ? amount + " HBAR" : ""}`}
          </NeonButton>
        </div>
      </div>
    </Modal>
  );
};

export default TipModal;

import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { userWalletContext } from "../../context/userWalletContext";
import topicMessageFnc from "../../client/topicMessage";
import { depositToEscrow } from "../../client/escrowContract";
import styles from "./CreateQuestionModal.module.css";

const CreateQuestionModal = ({ onClose, onSuccess }) => {
  const { accountId, walletData, balance } = useContext(userWalletContext);
  const topicId = import.meta.env.VITE_QUESTIONS_TOPIC_ID;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    bountyAmount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accountId) {
      toast.error("Please connect your wallet first");
      return;
    }

    const bountyAmount = formData.bountyAmount
      ? parseFloat(formData.bountyAmount)
      : 0;

    // Validate bounty amount against user balance
    if (bountyAmount > 0) {
      if (!balance) {
        toast.error("Unable to check your balance. Please try again.");
        return;
      }

      // Extract numeric balance from "X.XX HBAR" format
      const numericBalance = parseFloat(balance.replace(" HBAR", ""));
      const gasFeeBuffer = 1; // Reserve ~1 HBAR for gas fees
      const requiredAmount = bountyAmount + gasFeeBuffer;

      if (numericBalance < requiredAmount) {
        toast.error(
          `Insufficient balance. You need ${requiredAmount.toFixed(
            2
          )} HBAR (including gas fees), but only have ${numericBalance.toFixed(
            2
          )} HBAR.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 3); // Limit to 3 tags

      // Generate escrow ID using timestamp + accountId hash
      const escrowId =
        bountyAmount > 0
          ? BigInt(Date.now() + accountId.replace(/\./g, "")) %
            BigInt("0xFFFFFFFFFFFFFFFF") // Keep within uint64
          : null;

      const metaData = {
        title: formData.title,
        description: formData.description,
        tags: tagsArray,
        date: new Date().toISOString(),
        accountId,
      };

      // Deposit bounty into escrow before submitting question
      if (bountyAmount > 0) {
        const escrowContractId = import.meta.env.VITE_ESCROW_CONTRACT_ID;
        if (!escrowContractId) {
          toast.error(
            "Escrow contract not configured. Please contact administrator."
          );
          return;
        }

        await depositToEscrow(
          walletData,
          accountId,
          escrowContractId,
          escrowId.toString(),
          bountyAmount.toString()
        );
        metaData.bounty = bountyAmount;
        metaData.escrowId = escrowId.toString();
      }

      await topicMessageFnc(walletData, accountId, topicId, metaData);
      toast.success("Question created successfully!");
      onSuccess?.(metaData);
      onClose();
    } catch (error) {
      console.error("Failed to submit question:", error);
      toast.error("Failed to submit question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Ask a Question</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title">Title</label>
            <Input
              id="title"
              name="title"
              placeholder="What's your question?"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description</label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide more details about your question..."
              rows={6}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="tags">Tags (comma separated, max 3)</label>
            <Input
              id="tags"
              name="tags"
              placeholder="e.g. React, JavaScript, CSS"
              value={formData.tags}
              onChange={handleChange}
            />
            <small className={styles.fieldHint}>
              Add up to 3 tags to categorize your question
            </small>
          </div>

          <div className={styles.field}>
            <label htmlFor="bountyAmount">Bounty (Optional) - HBAR</label>
            <Input
              id="bountyAmount"
              name="bountyAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 10"
              value={formData.bountyAmount}
              onChange={handleChange}
            />
            <small className={styles.fieldHint}>
              {balance
                ? `Your balance: ${balance} | Reserve ~1 HBAR for gas fees. Add HBAR bounty to incentivize quality answers.`
                : "Add HBAR bounty to incentivize quality answers. The bounty will be sent to whoever gets their answer accepted."}
            </small>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Question"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateQuestionModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default CreateQuestionModal;

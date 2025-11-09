import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { userWalletContext } from "../../context/userWalletContext";
import topicMessageFnc from "../../client/topicMessage";
import styles from "./CreateQuestionModal.module.css";

const CreateQuestionModal = ({ onClose, onSuccess }) => {
  const { accountId, walletData } = useContext(userWalletContext);
  const topicId = import.meta.env.VITE_TOPIC_ID;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accountId) {
      alert("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      const metaData = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        icon: "https://cryptologos.cc/logos/hedera-hbar-logo.png",
        date: new Date().toISOString(),
        accountId,
        type: "question",
      };

      await topicMessageFnc(walletData, accountId, topicId, metaData);
      onSuccess?.(metaData);
      onClose();
    } catch (error) {
      console.error("Failed to submit question:", error);
      alert("Failed to submit question. Please try again.");
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
            <label htmlFor="tags">Tags (comma separated)</label>
            <Input
              id="tags"
              name="tags"
              placeholder="e.g. React, JavaScript, CSS"
              value={formData.tags}
              onChange={handleChange}
            />
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

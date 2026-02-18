import { useState } from "react";
import { Send, DollarSign } from "lucide-react";
import Modal from "../ui/Modal";
import NeonButton from "../ui/NeonButton";
import styles from "./CreateQuestionModal.module.css";
import PropTypes from "prop-types";

const CreateQuestionModalNew = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    codeSnippet: "",
    bounty: "",
    tags: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting new question:", formData);
    // Here we would call the contract/HCS hook
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask a Question">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input
            className={styles.input}
            placeholder="e.g. How to transfer tokens using Hedera SDK?"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            placeholder="Describe your problem in detail..."
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Code Snippet (Optional)</label>
          <textarea
            className={`${styles.textarea} ${styles.code}`}
            placeholder="// Paste your code here..."
            rows={4}
            value={formData.codeSnippet}
            onChange={(e) =>
              setFormData({ ...formData, codeSnippet: e.target.value })
            }
          />
        </div>

        <div className={styles.row}>
          <div className={`${styles.field} ${styles.flex1}`}>
            <label className={styles.label}>Bounty (HBAR)</label>
            <div className={styles.inputWrapper}>
              <DollarSign size={16} className={styles.icon} />
              <input
                type="number"
                className={styles.inputWithIcon}
                placeholder="50"
                value={formData.bounty}
                onChange={(e) =>
                  setFormData({ ...formData, bounty: e.target.value })
                }
              />
            </div>
          </div>
          <div className={`${styles.field} ${styles.flex1}`}>
            <label className={styles.label}>Tags</label>
            <input
              className={styles.input}
              placeholder="separate, with, commas"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
            />
          </div>
        </div>

        <div className={styles.actions}>
          <NeonButton variant="ghost" type="button" onClick={onClose}>
            Cancel
          </NeonButton>
          <NeonButton type="submit" icon={<Send size={16} />}>
            Post Question
          </NeonButton>
        </div>
      </form>
    </Modal>
  );
};

CreateQuestionModalNew.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CreateQuestionModalNew;

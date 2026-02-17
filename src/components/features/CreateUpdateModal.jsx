import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { userWalletContext } from "../../context/userWalletContext";
import topicMessageFnc from "../../client/topicMessage";
import styles from "./CreateQuestionModal.module.css";

const CreateUpdateModal = ({ onClose, onSuccess }) => {
  const { accountId, walletData } = useContext(userWalletContext);
  const topicId = import.meta.env.VITE_UPDATES_TOPIC_ID;

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
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 3); // Limit to 3 tags

      const metaData = {
        title: formData.title,
        description: formData.description,
        tags: tagsArray,
        date: new Date().toISOString(),
        accountId,
      };

      await topicMessageFnc(walletData, accountId, topicId, metaData);
      toast.success("Update posted successfully!");
      onSuccess?.(metaData);
      onClose();
    } catch (error) {
      console.error("Failed to submit update:", error);
      toast.error("Failed to submit update. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Share an Update</h2>
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
              placeholder="What's the update about?"
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
              placeholder="Share your insights, tips, or news with the community..."
              rows={8}
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
              placeholder="e.g. AI, Blockchain, Web3"
              value={formData.tags}
              onChange={handleChange}
            />
            <small className={styles.fieldHint}>
              Add up to 3 tags to categorize your update
            </small>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateUpdateModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default CreateUpdateModal;

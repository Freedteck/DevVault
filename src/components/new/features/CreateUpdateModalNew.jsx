import { useState, useContext } from "react";
import { Send, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import NeonButton from "../ui/NeonButton";
import MarkdownEditor from "../ui/MarkdownEditor";
import styles from "./CreateQuestionModal.module.css";
import { userWalletContext } from "../../../context/userWalletContext";
import { submitUpdate } from "../../../services/hcsService";
import toast from "react-hot-toast";

const CreateUpdateModalNew = ({ isOpen, onClose }) => {
  const { walletData, accountId } = useContext(userWalletContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    tags: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accountId || !walletData) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsSubmitting(true);

      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const updateData = {
        title: formData.title,
        content: formData.description,
        url: formData.url || null,
        tags,
      };

      await submitUpdate(updateData, walletData, accountId);

      toast.success("Update posted successfully!");

      // Reset form
      setFormData({
        title: "",
        description: "",
        url: "",
        tags: "",
      });

      onClose();
    } catch (error) {
      console.error("Error submitting update:", error);
      toast.error(`Failed to post update: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post an Update">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input
            className={styles.input}
            placeholder="e.g. Hedera Council approves new HIP"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <MarkdownEditor
            value={formData.description}
            onChange={(value) =>
              setFormData({ ...formData, description: value })
            }
            placeholder="Summarize the news or update... Markdown supported!"
            minRows={4}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Link URL (Optional)</label>
          <input
            className={styles.input}
            placeholder="https://..."
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tags</label>
          <input
            className={styles.input}
            placeholder="news, governance, tools"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        <div className={styles.actions}>
          <NeonButton
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </NeonButton>
          <NeonButton
            variant="cyan"
            type="submit"
            icon={
              isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )
            }
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Update"}
          </NeonButton>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUpdateModalNew;

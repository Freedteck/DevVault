import { useState, useContext } from "react";
import { Send, DollarSign, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import NeonButton from "../ui/NeonButton";
import MarkdownEditor from "../ui/MarkdownEditor";
import styles from "./CreateQuestionModal.module.css";
import { userWalletContext } from "../../context/userWalletContext";
import { submitQuestion } from "../../services/hcsService";
import toast from "react-hot-toast";

function triggerAIAgent(questionId: any) {
  const token = process.env.NEXT_PUBLIC_GITHUB_DISPATCH_TOKEN;
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO; // e.g. "Freedteck/DevVault"
  if (!token || !repo) return;

  fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "ai-agent-question",
      client_payload: { question_id: questionId },
    }),
  }).catch((err) => console.warn("AI agent dispatch failed:", err));
}

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateQuestionModalNew = ({
  isOpen,
  onClose,
}: CreateQuestionModalProps) => {
  const { walletData, accountId } = useContext(userWalletContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    codeSnippet: "",
    bounty: "",
    tags: "",
  });

  const handleSubmit = async (e: any) => {
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

      const questionData = {
        title: formData.title,
        description: formData.description,
        codeSnippet: formData.codeSnippet || "",
        tags,
        bounty: parseFloat(formData.bounty) || 0,
      };

      const result = await submitQuestion(questionData, walletData, accountId);

      toast.success(`Question posted! ID: ${result.questionId}`);

      triggerAIAgent(result.questionId);

      setFormData({
        title: "",
        description: "",
        codeSnippet: "",
        bounty: "",
        tags: "",
      });

      onClose();
    } catch (error: any) {
      console.error("Error submitting question:", error);
      toast.error(`Failed to post question: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
              setFormData({ ...formData, title: (e.target as any).value })
            }
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <MarkdownEditor
            value={formData.description}
            onChange={(value: any) =>
              setFormData({ ...formData, description: value })
            }
            placeholder="Describe your problem in detail... Markdown supported!"
            minRows={4}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Code Snippet (Optional)</label>
          <MarkdownEditor
            value={formData.codeSnippet}
            onChange={(value: any) =>
              setFormData({ ...formData, codeSnippet: value })
            }
            placeholder="```javascript\n// Paste your code here...\n```"
            minRows={4}
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
                  setFormData({ ...formData, bounty: (e.target as any).value })
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
                setFormData({ ...formData, tags: (e.target as any).value })
              }
            />
          </div>
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
            {isSubmitting ? "Posting..." : "Post Question"}
          </NeonButton>
        </div>
      </form>
    </Modal>
  );
};

export default CreateQuestionModalNew;

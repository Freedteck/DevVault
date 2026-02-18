import { useState, useContext } from "react";
import { Send, DollarSign, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import NeonButton from "../ui/NeonButton";
import styles from "./CreateQuestionModal.module.css";
import PropTypes from "prop-types";
import { userWalletContext } from "../../../context/userWalletContext";
import { submitQuestion } from "../../../services/hcsService";
import toast from "react-hot-toast";

const CreateQuestionModalNew = ({ isOpen, onClose }) => {
  const { walletData, accountId } = useContext(userWalletContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    codeSnippet: "",
    bounty: "",
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

      // Parse tags
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      // Prepare question data
      const questionData = {
        title: formData.title,
        description: formData.description,
        codeSnippet: formData.codeSnippet || "",
        tags,
        bounty: parseFloat(formData.bounty) || 0,
      };

      // Submit to HCS
      const result = await submitQuestion(questionData, walletData, accountId);

      toast.success(`Question posted! ID: ${result.questionId}`);

      // Trigger AI analysis in background
      try {
        const { analyzeAndAnswer } =
          await import("../../../services/aiQuestionAnalyzer");
        const { submitAnswer } = await import("../../../services/hcsService");

        console.log("🤖 Triggering AI analysis...");
        const aiResult = await analyzeAndAnswer(
          `${formData.title}\n\n${formData.description}`,
        );

        if (aiResult.shouldAnswer && aiResult.confidence >= 50) {
          console.log(
            `✅ AI providing answer (${aiResult.confidence}% confidence)`,
          );

          // Submit AI answer to HCS
          await submitAnswer(
            {
              questionId: result.questionId,
              content: aiResult.answer,
              isAI: true,
              confidence: aiResult.confidence,
            },
            walletData,
            accountId,
          );

          toast.success("AI has provided an instant answer!");
        } else {
          console.log(`❌ AI routing to humans: ${aiResult.reasoning}`);
        }
      } catch (aiError) {
        console.error("AI analysis error (non-blocking):", aiError);
        // Don't show error to user - AI is optional
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        codeSnippet: "",
        bounty: "",
        tags: "",
      });

      // Close modal and trigger refresh after a delay (mirror node indexing)
      onClose();
      // setTimeout(() => {
      //   window.location.reload(); // Simple refresh to show new question
      // }, 2000);
    } catch (error) {
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

CreateQuestionModalNew.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CreateQuestionModalNew;

import { useState } from "react";
import {
  Bot,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
} from "lucide-react";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import styles from "./AIResponse.module.css";
import PropTypes from "prop-types";

/**
 * AIResponse - Shows AI-generated instant answer with confidence scoring
 *
 * Flow:
 * - High confidence (>80%): Show answer directly
 * - Medium confidence (50-80%): Show answer with caution
 * - Low confidence (<50%): Suggest human expert instead
 */
const AIResponse = ({
  questionId,
  answer,
  confidence,
  reasoning,
  onPostBounty,
  onRate,
  isLoading,
}) => {
  const [userRating, setUserRating] = useState(null);

  const handleRate = (helpful) => {
    setUserRating(helpful);
    onRate?.(questionId, helpful);
  };

  const getConfidenceLevel = () => {
    if (confidence >= 80)
      return { level: "high", color: "green", text: "High Confidence" };
    if (confidence >= 50)
      return { level: "medium", color: "yellow", text: "Medium Confidence" };
    return { level: "low", color: "red", text: "Low Confidence - Needs Human" };
  };

  const confidenceInfo = getConfidenceLevel();

  if (isLoading) {
    return (
      <GlassCard className={styles.aiCard}>
        <div className={styles.loadingState}>
          <Bot className={styles.loadingIcon} size={32} />
          <p>AI is analyzing your question...</p>
        </div>
      </GlassCard>
    );
  }

  // Low confidence - suggest bounty
  if (confidence < 50) {
    return (
      <GlassCard className={`${styles.aiCard} ${styles.needsHuman}`}>
        <div className={styles.header}>
          <div className={styles.aiLabel}>
            <AlertTriangle size={20} className={styles.warningIcon} />
            <span>AI Assessment</span>
          </div>
          <span
            className={`${styles.confidenceBadge} ${styles[confidenceInfo.color]}`}
          >
            {confidence}% {confidenceInfo.text}
          </span>
        </div>

        <div className={styles.needsHumanContent}>
          <h3>This question needs a human expert</h3>
          <p>
            {reasoning ||
              "This appears to be a complex problem that requires specialized knowledge and debugging. An experienced developer can provide better assistance."}
          </p>

          <div className={styles.suggestion}>
            <TrendingUp size={18} />
            <span>Post a bounty to attract expert developers</span>
          </div>

          <NeonButton
            onClick={onPostBounty}
            icon={<Sparkles size={16} />}
            fullWidth
          >
            Post Bounty for Human Expert
          </NeonButton>
        </div>
      </GlassCard>
    );
  }

  // Medium/High confidence - show answer
  return (
    <GlassCard className={styles.aiCard}>
      <div className={styles.header}>
        <div className={styles.aiLabel}>
          <Bot size={20} className={styles.aiIcon} />
          <span>AI Instant Answer</span>
          <span className={styles.agentName}>by DevVault Assistant</span>
        </div>
        <span
          className={`${styles.confidenceBadge} ${styles[confidenceInfo.color]}`}
        >
          {confidence}% {confidenceInfo.text}
        </span>
      </div>

      <div className={styles.answerContent}>
        <div
          className={styles.answerBody}
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      </div>

      {confidence < 80 && (
        <div className={styles.cautionNotice}>
          <AlertTriangle size={16} />
          <span>
            AI is moderately confident. Consider posting a bounty if this does
            not fully solve your problem.
          </span>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.ratingSection}>
          <span className={styles.ratingLabel}>Was this helpful?</span>
          <div className={styles.ratingButtons}>
            <button
              className={`${styles.ratingBtn} ${userRating === true ? styles.active : ""}`}
              onClick={() => handleRate(true)}
              disabled={userRating !== null}
            >
              <ThumbsUp size={16} />
              Helpful
            </button>
            <button
              className={`${styles.ratingBtn} ${userRating === false ? styles.active : ""}`}
              onClick={() => handleRate(false)}
              disabled={userRating !== null}
            >
              <ThumbsDown size={16} />
              Not Helpful
            </button>
          </div>
        </div>

        {userRating === false && (
          <NeonButton
            onClick={onPostBounty}
            icon={<Sparkles size={14} />}
            variant="secondary"
          >
            Post Bounty for Better Answer
          </NeonButton>
        )}
      </div>
    </GlassCard>
  );
};

AIResponse.propTypes = {
  questionId: PropTypes.string.isRequired,
  answer: PropTypes.string,
  confidence: PropTypes.number,
  reasoning: PropTypes.string,
  isLoading: PropTypes.bool,
  onPostBounty: PropTypes.func,
  onRate: PropTypes.func,
};

export default AIResponse;

import { useState, useEffect, useRef } from "react";
import { Clock, Shield, AlertCircle } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import styles from "./ArbitrationTimer.module.css";

interface ArbitrationTimerProps {
  questionCreatedAt: string;
  hasBounty: boolean;
  hasAcceptedAnswer: boolean;
  arbitrationDelay?: number;
  onArbitrationTrigger?: () => void;
}

const ArbitrationTimer = ({
  questionCreatedAt,
  hasBounty,
  hasAcceptedAnswer,
  arbitrationDelay = 7 * 24 * 60 * 60 * 1000,
  onArbitrationTrigger,
}: ArbitrationTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<any>(null);
  const hasTriggeredRef = useRef(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!hasBounty || hasAcceptedAnswer) return;

    hasTriggeredRef.current = false;

    const calculateTime = () => {
      const now = Date.now();
      const createdTime = new Date(questionCreatedAt).getTime();
      const arbitrationTime = createdTime + arbitrationDelay;
      const remaining = arbitrationTime - now;

      if (remaining <= 0) {
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          clearInterval(timerRef.current);
          onArbitrationTrigger?.();
        }
        return 0;
      }

      return remaining;
    };

    timerRef.current = setInterval(() => {
      setTimeRemaining(calculateTime());
    }, 1000);

    setTimeRemaining(calculateTime());

    return () => clearInterval(timerRef.current);
  }, [
    questionCreatedAt,
    hasBounty,
    hasAcceptedAnswer,
    arbitrationDelay,
    onArbitrationTrigger,
  ]);

  if (!hasBounty || hasAcceptedAnswer || timeRemaining === null) {
    return null;
  }

  const formatTime = (ms: number) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getUrgency = () => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (timeRemaining <= oneDayMs) return "urgent";
    if (timeRemaining <= 2 * oneDayMs) return "warning";
    return "normal";
  };

  const urgency = getUrgency();

  if (timeRemaining <= 0) {
    return (
      <GlassCard className={`${styles.timerCard} ${styles.triggered}`}>
        <div className={styles.header}>
          <Shield className={styles.icon} size={20} />
          <span className={styles.title}>AI Arbiter Active</span>
        </div>
        <p className={styles.description}>
          The arbitration window has closed. AI arbiter is analyzing all answers
          to release the bounty fairly.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`${styles.timerCard} ${styles[urgency]}`}>
      <div className={styles.header}>
        <Clock className={styles.icon} size={20} />
        <span className={styles.title}>Auto-Arbitration Timer</span>
      </div>

      <div className={styles.countdown}>
        <div className={styles.timeDisplay}>{formatTime(timeRemaining)}</div>
        <div className={styles.timeLabel}>remaining</div>
      </div>

      <div className={styles.description}>
        {urgency === "urgent" && (
          <div className={styles.urgentNotice}>
            <AlertCircle size={16} />
            <span>Less than 24 hours! Accept an answer or AI will decide.</span>
          </div>
        )}
        <p>
          If you do not accept an answer, the AI arbiter will automatically
          analyze all responses and release the bounty to the highest-quality
          answer. This ensures contributors get paid even if you are
          unavailable.
        </p>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${100 - (timeRemaining / arbitrationDelay) * 100}%`,
          }}
        />
      </div>
    </GlassCard>
  );
};

export default ArbitrationTimer;

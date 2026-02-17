import { useState } from "react";
import PropTypes from "prop-types";
import { Check, CheckCheck } from "lucide-react";
import styles from "./AcceptAnswerButton.module.css";

const AcceptAnswerButton = ({
  answerId,
  answerAuthorId,
  isAccepted = false,
  currentUserId,
  onAccept,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const isAnswerAuthor = currentUserId && currentUserId === answerAuthorId;
  const isDisabled = disabled || loading || isAnswerAuthor || !currentUserId;

  const handleClick = async () => {
    if (isDisabled || isAccepted) return;

    setLoading(true);
    try {
      await onAccept(answerId);
    } catch (error) {
      console.error("Error accepting answer:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show accepted state
  if (isAccepted) {
    return (
      <div className={styles.acceptedState}>
        <CheckCheck className={styles.icon} size={18} />
        <span>Accepted Answer</span>
      </div>
    );
  }

  let buttonTitle = "Mark this as the accepted answer";
  if (!currentUserId) {
    buttonTitle = "Connect your wallet to accept answers";
  } else if (isAnswerAuthor) {
    buttonTitle = "You cannot accept your own answer";
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`${styles.acceptButton} ${loading ? styles.loading : ""}`}
      title={buttonTitle}
    >
      {loading ? (
        <>
          <span className={styles.spinner} />
          <span>Accepting...</span>
        </>
      ) : (
        <>
          <Check className={styles.icon} size={18} />
          <span>Accept Answer</span>
        </>
      )}
    </button>
  );
};

AcceptAnswerButton.propTypes = {
  answerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  answerAuthorId: PropTypes.string.isRequired,
  isAccepted: PropTypes.bool,
  currentUserId: PropTypes.string,
  onAccept: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default AcceptAnswerButton;

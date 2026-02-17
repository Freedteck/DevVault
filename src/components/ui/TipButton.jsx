import { useContext } from "react";
import PropTypes from "prop-types";
import { Heart } from "lucide-react";
import { userWalletContext } from "../../context/userWalletContext";
import { useTokenAssociation } from "../../hooks/useTokenAssociation";
import styles from "./TipButton.module.css";

const TipButton = ({ accountId, onClick }) => {
  const { accountId: currentUserId } = useContext(userWalletContext);
  const { isAssociated: isCurrentUserAssociated } =
    useTokenAssociation(currentUserId);
  const { isAssociated: isTargetUserAssociated } =
    useTokenAssociation(accountId);

  const isDisabled =
    !currentUserId || !isCurrentUserAssociated || !isTargetUserAssociated;

  const getTooltipText = () => {
    if (!currentUserId) return "Connect wallet to tip";
    if (!isCurrentUserAssociated) return "Associate DVT token to tip";
    if (!isTargetUserAssociated) return "User not associated with DVT token";
    return "";
  };

  return (
    <div className={styles.tooltipContainer}>
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={styles.tipButton}
      >
        <Heart size={16} />
        <span>Tip</span>
      </button>
      {isDisabled && <div className={styles.tooltip}>{getTooltipText()}</div>}
    </div>
  );
};

TipButton.propTypes = {
  accountId: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default TipButton;

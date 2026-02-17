import { useState, useContext } from "react";
import { AlertCircle } from "lucide-react";
import { userWalletContext } from "../../context/userWalletContext";
import { useTokenAssociation } from "../../hooks/useTokenAssociation";
import { associateToken } from "../../client/tokenAssociation";
import Button from "./Button";
import styles from "./TokenAssociationBanner.module.css";

const TokenAssociationBanner = () => {
  const { accountId, walletData } = useContext(userWalletContext);
  const { isAssociated } = useTokenAssociation(accountId);
  const [isAssociating, setIsAssociating] = useState(false);
  //   const [isDismissed, setIsDismissed] = useState(false);

  const handleAssociate = async () => {
    if (!walletData || !accountId) return;

    setIsAssociating(true);
    try {
      await associateToken(
        walletData,
        accountId,
        import.meta.env.VITE_TOKEN_ID
      );
      // Refetch will happen automatically due to the hook
    } catch (error) {
      console.error("Failed to associate token:", error);
    } finally {
      setIsAssociating(false);
    }
  };

  //   const handleDismiss = () => {
  //     setIsDismissed(true);
  //   };

  // Don't show banner if:
  // - No account connected
  // - Token association status unknown
  // - User is already associated
  // - Banner is dismissed
  if (
    !accountId ||
    isAssociated === null ||
    isAssociated === true
    //|| isDismissed
  ) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <div className={styles.content}>
          <AlertCircle size={16} className={styles.icon} />
          <span className={styles.message}>
            Associate DVT token to unlock tipping and full platform features
          </span>
        </div>
        <div className={styles.actions}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAssociate}
            disabled={isAssociating}
            className={styles.associateButton}
          >
            {isAssociating ? "Associating..." : "Associate Token"}
          </Button>
          {/* <button
            onClick={handleDismiss}
            className={styles.dismissButton}
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default TokenAssociationBanner;

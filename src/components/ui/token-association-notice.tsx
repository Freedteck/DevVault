import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import hederaService from "@/services/hedera-service";
import { useAuth } from "@/context/auth-context";
import { TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";
import { WalletConnectClient } from "@/client/walletConnectClient";
import { userWalletContext } from "@/context/userWalletContext";
import { toast } from "sonner";

interface TokenAssociationNoticeProps {
  className?: string;
  variant?: "banner" | "card";
}

export function TokenAssociationNotice({ 
  className = "",
  variant = "card"
}: TokenAssociationNoticeProps) {
  const [associating, setAssociating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenAssociated, setIsTokenAssociated] = useState(false);
  const {accountId} = useContext(userWalletContext);


  useEffect(() => {
    const checkTokenAssociation = async () => {
        if (accountId) {
        const {isTokenAssociated} = await WalletConnectClient();
        const isAssociated = await isTokenAssociated(accountId);
        setIsTokenAssociated(isAssociated);
        }
    }
    checkTokenAssociation().catch(console.error);
  },[accountId])
  

  const handleAssociateToken = async () => {
    if (!accountId) {
      setError("You need to connect your wallet first");
      return;
    }
    if(isTokenAssociated) {
      setError("Your account is already associated with the token.");
      return;

    }
    const {associateToken} = await WalletConnectClient();
    const toastId = toast.loading("Associating token...");
    const transactionId = await associateToken().catch(console.error);

    if (transactionId) {
      setAssociating(true);
      toast.success("Token associated successfully!", { id: toastId });
      setIsTokenAssociated(true);
      setAssociating(false);
    } else {
      setError("Failed to associate token. Please try again.");
      toast.error("Failed to associate token.", { id: toastId });
    }


}

    

  if (isTokenAssociated) {
    if (variant === "banner") {
      return (
        <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-md flex items-center gap-2 mb-4 ${className}`}>
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Your account is associated with {TOKEN_SYMBOL} tokens. You can now earn rewards from other users.
          </p>
        </div>
      )
    }

    return (
      <Card className={`p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 mb-4 ${className}`}>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-green-700 dark:text-green-300">
            Your account is associated with {TOKEN_SYMBOL} tokens! You can now earn rewards from other users.
          </p>
        </div>
      </Card>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md mb-4 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="font-medium text-sm text-amber-800 dark:text-amber-300">
            Associate your account with {TOKEN_SYMBOL} tokens to earn rewards
          </p>
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-2 ml-7">
            {error}
          </p>
        )}
        <Button 
          onClick={handleAssociateToken} 
          disabled={associating}
          size="sm"
          className="ml-7 bg-amber-600 hover:bg-amber-700 text-white"
        >
          {associating ? 'Associating...' : 'Associate with DVT Token'}
        </Button>
      </div>
    );
  }

  return (
    <Card className={`p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mb-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="font-medium text-amber-800 dark:text-amber-300">
            Your account is not associated with {TOKEN_SYMBOL} tokens
          </p>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-300 ml-7">
          To earn rewards from other users for your contributions, you need to associate your account with 
          the {TOKEN_NAME} ({TOKEN_SYMBOL}). This is a one-time process that enables you to receive tips and rewards.
        </p>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 ml-7">
            {error}
          </p>
        )}
        <Button 
          onClick={handleAssociateToken} 
          disabled={associating}
          className="ml-7 bg-amber-600 hover:bg-amber-700 text-white"
        >
          {associating ? 'Associating...' : 'Associate with DVT Token'}
        </Button>
      </div>
    </Card>
  );
}
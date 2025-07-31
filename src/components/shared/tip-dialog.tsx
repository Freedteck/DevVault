import { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_TIP_AMOUNTS, TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";
import { UserAvatar } from "./user-avatar";
import { toast } from "sonner";
import { userWalletContext } from "@/context/userWalletContext";
import { contentData } from "@/context/ContentData";

interface TipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: any;
  postId?: string;
  commentId?: string;
}

export function TipDialog({ isOpen, onClose, recipient }: TipDialogProps) {
  const { userProfile } = useContext(userWalletContext);
  const [amount, setAmount] = useState(DEFAULT_TIP_AMOUNTS[1].toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendTip } = useContext(contentData);

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      toast.error("You must be logged in to tip");
      return;
    }

    const tipAmount = parseInt(amount, 10);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (tipAmount > userProfile?.tokenBalance) {
      toast.error("Insufficient balance");
      return;
    }

    const toastId = toast.loading("Processing your tip...");
    try {
      setIsSubmitting(true);

      // Call Hedera service to transfer tokens
      const result = await sendTip(recipient.account_id, tipAmount);

      if (result) {
        toast.success(
          `Successfully tipped ${tipAmount} ${TOKEN_SYMBOL} to ${recipient.full_name}`,
          { id: toastId }
        );
        onClose();
      } else {
        toast.error("Transaction failed. Please try again.", { id: toastId });
      }
    } catch (error) {
      console.error("Tip error:", error);
      toast.error("An error occurred. Please try again later.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send tip</DialogTitle>
          <DialogDescription>
            Support {recipient.full_name} for their contribution
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex items-center justify-between">
              <UserAvatar user={recipient} showName size="lg" />
              <div className="text-sm text-muted-foreground">
                Your balance: {userProfile?.tokenBalance} {TOKEN_SYMBOL}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_TIP_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={amount === value.toString() ? "default" : "outline"}
                  onClick={() => handleQuickAmount(value)}
                >
                  {value} {TOKEN_SYMBOL}
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom amount"
                min="1"
                max={userProfile?.tokenBalance || 0}
              />
              <span className="text-muted-foreground">{TOKEN_SYMBOL}</span>
            </div>

            <div className="text-sm text-muted-foreground">
              Send {TOKEN_NAME} tokens to reward this contribution.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Send Tip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

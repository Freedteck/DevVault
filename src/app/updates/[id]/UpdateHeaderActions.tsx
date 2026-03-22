"use client";

import { useState } from "react";
import { TipModal } from "@/components/ui/TipModal";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/ToastContext";
import { userSendVRSTip, userSendHBARTip } from "@/lib/hedera-client-tx";

interface Props {
  authorDisplayName: string;
  authorAccountId: string;
}

export function UpdateHeaderActions({
  authorDisplayName,
  authorAccountId,
}: Props) {
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isTipping, setIsTipping] = useState(false);

  const { accountId, isConnected, connector } = useWallet();
  const { showToast } = useToast();

  const handleTipClick = () => {
    if (!isConnected || !accountId || !connector) {
      showToast("Please connect your wallet to tip.", "error");
      return;
    }
    if (authorAccountId === accountId) {
      showToast("You cannot tip yourself.", "error");
      return;
    }
    setIsTipModalOpen(true);
  };

  const confirmTip = async (amount: number, currency: "VRS" | "HBAR") => {
    if (!accountId || !connector) return;
    setIsTipping(true);
    try {
      if (currency === "VRS") {
        await userSendVRSTip(connector, accountId, authorAccountId, amount);
      } else {
        await userSendHBARTip(connector, accountId, authorAccountId, amount);
      }
      setIsTipModalOpen(false);
      showToast(
        `Successfully tipped ${amount} ${currency} to ${authorDisplayName}!`,
        "success",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("REJECTED")) {
        showToast("Tip cancelled in wallet", "error");
      } else {
        showToast(`Tip failed: ${msg}`, "error");
      }
    } finally {
      setIsTipping(false);
    }
  };

  return (
    <>
      <div className="shrink-0 flex items-center gap-3">
        <button
          onClick={handleTipClick}
          className="sm:ml-auto text-xs font-medium text-text-muted hover:text-primary-400 transition-colors"
        >
          Tip Author
        </button>
      </div>

      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        recipientName={authorDisplayName}
        onConfirm={confirmTip}
        isSubmitting={isTipping}
      />
    </>
  );
}

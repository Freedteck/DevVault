"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/ToastContext";
import { swapHbarForVRS } from "@/lib/hedera-contracts";
import { isVRSAssociated, userAssociateVRS } from "@/lib/hedera-client-tx";

const VRS_PER_HBAR = 92;

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SwapModal({ isOpen, onClose }: SwapModalProps) {
  const { accountId, isConnected, connector } = useWallet();
  const { showToast } = useToast();

  const [hbarAmount, setHbarAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  const parsedHbar = parseFloat(hbarAmount) || 0;
  const expectedVRS = parsedHbar * VRS_PER_HBAR;

  const handleSwap = async () => {
    if (!isConnected || !accountId || !connector) {
      showToast("Connect your wallet first.", "error");
      return;
    }
    if (parsedHbar <= 0) {
      showToast("Enter a valid HBAR amount.", "error");
      return;
    }
    if (parsedHbar < 0.1) {
      showToast("Minimum swap is 0.1 HBAR.", "error");
      return;
    }

    setIsSwapping(true);
    try {
      // Step 1: Associate VRS token if not already associated
      const associated = await isVRSAssociated(accountId);
      if (!associated) {
        showToast("Associating VRS token with your account…", "success");
        await userAssociateVRS(connector, accountId);
      }

      // Step 2: Submit the swap
      const { transactionId, expectedVRS: vrs } = await swapHbarForVRS(
        connector,
        { accountId, hbarAmount: parsedHbar },
      );
      showToast(
        `Swap submitted! Expect ~${vrs} VRS to arrive shortly. TX: ${transactionId.slice(0, 20)}…`,
        "success",
      );
      setHbarAmount("");
      onClose();
    } catch (err) {
      showToast(`Swap failed: ${String(err)}`, "error");
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Swap HBAR → VRS">
      <div className="space-y-6">
        <p className="text-sm text-text-secondary">
          Exchange HBAR for Vurso Token (VRS) at a fixed rate. VRS is used
          for tipping, bounties, and reputation.
        </p>

        <div className="rounded-lg border border-border-main bg-bg-subtle p-4 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Rate
          </span>
          <span className="font-mono text-sm font-bold text-primary-400">
            1 ℏ = {VRS_PER_HBAR} VRS
          </span>
        </div>

        {/* HBAR input */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            You Send
          </label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-border-main bg-bg-panel focus-within:border-primary-500 transition-colors">
            <input
              type="number"
              placeholder="0.0"
              min="0.1"
              step="0.1"
              value={hbarAmount}
              onChange={(e) => setHbarAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text-main outline-none"
            />
            <span className="text-xs font-bold text-text-muted">ℏ HBAR</span>
          </div>
        </div>

        {/* VRS output preview */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            You Receive (~)
          </label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-border-main/50 bg-bg-subtle">
            <span className="flex-1 text-sm font-mono font-bold text-primary-400">
              {expectedVRS > 0 ? expectedVRS.toLocaleString() : "0"}
            </span>
            <span className="text-xs font-bold text-text-muted">VRS</span>
          </div>
          <p className="text-[11px] text-text-muted">
            VRS will be transferred to your Hedera account after the swap is
            confirmed on-chain.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium border border-border-main text-text-secondary hover:border-primary-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSwap}
            disabled={isSwapping || parsedHbar < 0.1}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50"
          >
            {isSwapping
              ? "Signing…"
              : `Swap ${parsedHbar > 0 ? parsedHbar : ""} ℏ`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

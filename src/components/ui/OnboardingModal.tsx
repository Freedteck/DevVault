"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/ToastContext";
import { userCreateProfile } from "@/lib/hedera-client-tx";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { accountId, connector, refreshActivationStatus } = useWallet();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOnboard = async () => {
    if (!connector || !accountId) return;
    if (!displayName.trim()) {
      showToast("Please enter a display name.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      showToast("Activating your account on Hedera...", "info");
      await userCreateProfile(connector, {
        accountId,
        displayName: displayName.trim(),
        bio: "Joined DevVault",
        skills: [],
      });

      showToast("Account activated! You're ready for DVT rewards.", "success");
      await refreshActivationStatus();
      onClose();
    } catch (err) {
      showToast(`Activation failed: ${String(err)}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activate Your Account">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            DevVault uses <strong>HCS-11</strong> for on-chain identities. Activating your
            account sets up your decentralized profile and enables <strong>automatic
            DVT rewards</strong>.
          </p>
          <p className="text-[11px] text-text-muted italic">
            Note: This requires a one-time blockchain transaction to set your
            account memo.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Choose a Display Name
          </label>
          <input
            type="text"
            placeholder="e.g. SatoshiDev"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-border-main bg-bg-panel text-sm text-text-main outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium border border-border-main text-text-secondary hover:border-primary-500 transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleOnboard}
            disabled={isSubmitting || !displayName.trim()}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Activating..." : "Activate Now"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

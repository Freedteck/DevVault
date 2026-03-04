"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { OnboardingModal } from "./OnboardingModal";

export function OnboardingBanner() {
  const { isConnected, isAccountActivated, isCheckingActivation } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't show if not connected, already activated, or still checking
  if (!isConnected || isAccountActivated || isCheckingActivation) {
    return null;
  }

  return (
    <>
      <div className="mb-6 rounded-lg border border-primary-500/20 bg-primary-950/20 p-4 shadow-sm group hover:border-primary-500/40 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main group-hover:text-primary-400 transition-colors">
                Activate Your Vurso Identity
              </h3>
              <p className="text-xs text-text-secondary">
                Set up your HCS-11 profile to enable automatic VRS rewards and
                reputation.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2 rounded-md text-xs font-bold uppercase tracking-widest bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-md active:scale-95"
          >
            Activate Now
          </button>
        </div>
      </div>

      <OnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

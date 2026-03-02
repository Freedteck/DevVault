"use client";

import Link from "next/link";
import { ConnectWalletModal } from "@/components/ui/ConnectWalletModal";
import { SwapModal } from "@/components/ui/SwapModal";
import { useToast } from "@/components/ui/ToastContext";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useState } from "react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { accountId, isConnected, isConnecting, connect, disconnect } =
    useWallet();
  const { showToast } = useToast();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const handleConnectClick = () => {
    if (isConnected) {
      disconnect().then(() => showToast("Wallet disconnected", "info"));
    } else {
      // Try opening the WalletConnect modal directly
      connect().catch(() => {
        // Fallback to the custom modal if direct connect isn't available yet
        setIsWalletModalOpen(true);
      });
    }
  };

  const handleModalConnect = async () => {
    setIsWalletModalOpen(false);
    await connect();
    if (accountId) {
      showToast(`Connected: ${accountId}`, "success");
    }
  };

  const displayAddress = accountId
    ? accountId.length > 12
      ? `${accountId.slice(0, 6)}…${accountId.slice(-4)}`
      : accountId
    : "Connect";

  return (
    <>
      <header className="border-b shrink-0 bg-bg-panel border-border-main">
        <nav className="mx-auto w-full max-w-[1500px] flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 rounded-md hover:bg-bg-subtle text-text-secondary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-sm hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search Den..."
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-md border outline-none bg-bg-subtle border-border-main text-text-main focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isConnected && (
              <button
                onClick={() => setIsSwapModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border-main text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors hidden sm:flex"
              >
                <span className="font-mono">↔</span>
                <span>Swap DVT</span>
              </button>
            )}
            <Link
              href="/questions/new"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors bg-primary-600 hover:bg-primary-700 text-white"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="hidden sm:inline">Ask Question</span>
              <span className="sm:hidden">Ask</span>
            </Link>

            <button
              onClick={handleConnectClick}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium border transition-colors ${
                isConnected
                  ? "bg-primary-950/20 border-primary-500/30 text-primary-400 hover:border-red-500/50 hover:text-red-400"
                  : "bg-transparent border-border-main text-text-secondary hover:border-primary-500 hover:text-primary-500"
              } ${isConnecting ? "opacity-60 cursor-wait" : ""}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span className="hidden sm:inline font-mono text-xs">
                {isConnecting ? "Connecting…" : displayAddress}
              </span>
              <span className="sm:hidden">Wallet</span>
            </button>
          </div>
        </nav>
      </header>

      <ConnectWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleModalConnect}
      />

      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
      />
    </>
  );
}

"use client";

import Link from "next/link";
import { ConnectWalletModal } from "@/components/ui/ConnectWalletModal";
import { SwapModal } from "@/components/ui/SwapModal";
import { useToast } from "@/components/ui/ToastContext";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useState } from "react";
import { GlobalSearch } from "@/components/navigation/GlobalSearch";
import { Avatar } from "@/components/ui/primitives";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { accountId, isConnected, isConnecting, connect, disconnect } =
    useWallet();
  const { showToast } = useToast();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
      <header
        suppressHydrationWarning
        className="border-b shrink-0 bg-bg-panel border-border-main"
      >
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

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="sm:hidden p-2 rounded-md hover:bg-bg-subtle text-text-secondary"
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Search (Desktop) */}
            <div className="flex-1 max-w-sm hidden sm:block">
              <GlobalSearch />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isConnected && (
              <button
                onClick={() => setIsSwapModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border-main text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors"
                title="Swap HBAR for VRS"
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
                  <path d="m16 3 4 4-4 4" />
                  <path d="M20 7H4" />
                  <path d="m8 21-4-4 4-4" />
                  <path d="M4 17h16" />
                </svg>
                <span className="hidden sm:inline">Swap VRS</span>
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
              <span className="sm:hidden flex items-center">
                {isConnecting ? (
                  "…"
                ) : isConnected ? (
                  <Avatar accountId={accountId!} size={20} hideText />
                ) : (
                  "Wallet"
                )}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-bg-panel h-14 border-b border-border-main px-4 flex items-center gap-2 sm:hidden">
          <GlobalSearch
            autoFocus
            onClose={() => setIsMobileSearchOpen(false)}
          />
        </div>
      )}

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

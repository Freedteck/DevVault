"use client";

import { Modal } from "./Modal";
import { useState } from "react";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletType: string) => void;
}

export function ConnectWalletModal({
  isOpen,
  onClose,
  onConnect,
}: ConnectWalletModalProps) {
  const wallets = [
    {
      id: "hashconnect",
      name: "HashConnect",
      icon: "H",
      color: "bg-primary-600",
    },
    { id: "blade", name: "Blade Wallet", icon: "B", color: "bg-blue-600" },
    { id: "metamask", name: "MetaMask", icon: "M", color: "bg-orange-600" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Select your preferred Hedera wallet to access your VRS balance and
          interact with the vault.
        </p>
        <div className="space-y-2">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => onConnect(wallet.id)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-border-main bg-bg-subtle/50 hover:bg-bg-hover hover:border-primary-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-10 h-10 ${wallet.color} rounded flex items-center justify-center text-white font-bold`}
                >
                  {wallet.icon}
                </span>
                <span className="font-medium text-text-main group-hover:text-primary-400 transition-colors">
                  {wallet.name}
                </span>
              </div>
              <svg
                className="text-text-muted group-hover:text-primary-500 transition-all transform group-hover:translate-x-1"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

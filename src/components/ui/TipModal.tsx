"use client";

import { Modal } from "./Modal";
import { useState } from "react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  /** Called when user confirms — parent is responsible for executing the transaction */
  onConfirm: (amount: number, currency: "DVT" | "HBAR") => void;
  isSubmitting?: boolean;
}

export function TipModal({
  isOpen,
  onClose,
  recipientName,
  onConfirm,
  isSubmitting = false,
}: TipModalProps) {
  const [amount, setAmount] = useState<string>("5");
  const [currency, setCurrency] = useState<"DVT" | "HBAR">("DVT");

  const quickAmounts = ["5", "10", "25", "50"];

  const handleConfirm = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    onConfirm(parsed, currency);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tip ${recipientName}`}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !parseFloat(amount)}
            className="flex-1 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing..." : `Tip ${amount} ${currency}`}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Currency Toggle */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Token
          </label>
          <div className="flex gap-2">
            {(["DVT", "HBAR"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`flex-1 py-2 rounded border text-xs font-mono font-bold transition-all ${
                  currency === c
                    ? "bg-primary-600/10 border-primary-500 text-primary-400"
                    : "border-border-main text-text-muted hover:border-text-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full px-4 py-3 bg-bg-subtle border border-border-main rounded-md text-lg font-mono font-bold text-primary-500 outline-none focus:border-primary-500 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs uppercase tracking-widest">
              {currency}
            </span>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q)}
              className={`flex-1 py-2 rounded border text-xs font-mono transition-all ${
                amount === q
                  ? "bg-primary-600/10 border-primary-500 text-primary-400"
                  : "border-border-main text-text-muted hover:border-text-muted"
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-text-muted leading-relaxed">
          {currency === "DVT"
            ? "Tips are sent directly on-chain via Hedera Token Service. A small HBAR network fee applies."
            : "HBAR is sent directly on-chain via Hedera. A small network fee applies."}
        </p>
      </div>
    </Modal>
  );
}

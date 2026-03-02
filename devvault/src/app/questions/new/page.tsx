"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/ToastContext";
import { userPostQuestion } from "@/lib/hedera-client-tx";
import { lockBounty } from "@/lib/hedera-contracts";

export default function AskQuestionPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [bounty, setBounty] = useState("");
  const [currency, setCurrency] = useState<"DVT" | "HBAR">("DVT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { accountId, isConnected, connector } = useWallet();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!isConnected || !accountId || !connector) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!title.trim()) {
      showToast("Question title is required.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await userPostQuestion(connector, {
        title: title.trim(),
        // shortDescription: first 160 chars of body, or a summary of title if body is empty
        shortDescription:
          body.trim().slice(0, 160) || title.trim().slice(0, 160),
        body: body.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        // TODO: replace displayName with actual profile name from HCS Registry
        author: { accountId, displayName: accountId },
        bountyAmount: bounty ? parseFloat(bounty) : 0,
        bountyCurrency: currency,
      });

      // If an HBAR bounty is specified, lock it in the smart contract
      if (bounty && currency === "HBAR" && parseFloat(bounty) > 0) {
        try {
          await lockBounty(connector, {
            accountId,
            topicId: result.discussionTopicId,
            sequenceNumber: 0, // sequence not yet known; use topic as unique key
            hbarAmount: parseFloat(bounty),
          });
          showToast(
            `Question live + ${bounty} HBAR bounty locked in escrow! TX: ${result.transactionId.slice(0, 20)}…`,
            "success",
          );
        } catch {
          // Non-fatal: question was posted, bounty lock failed
          showToast(
            `Question posted! Bounty lock failed — retry from the question page.`,
            "success",
          );
        }
      } else {
        showToast(
          `Question live on Hedera! TX: ${result.transactionId.slice(0, 24)}…`,
          "success",
        );
      }

      router.push("/questions");
    } catch (err) {
      showToast(`Failed: ${String(err)}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-main mb-1">
          Post to the Den
        </h1>
        <p className="text-sm text-text-secondary">
          Ask a technical question and optionally lock a bounty to incentivize
          high-quality answers.
        </p>
      </div>

      <div className="space-y-6">
        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Question Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to optimize HCS message throughput in a high-load app?"
            className="w-full px-4 py-2.5 bg-bg-panel border border-border-main rounded-md text-sm text-text-main outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>

        {/* Bounty Section */}
        <div className="space-y-3 p-5 rounded-xl bg-bg-panel border border-border-main/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                Incentivize Solution (Bounty)
              </label>
              <div className="group/info relative cursor-help">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-muted hover:text-primary-500 transition-colors"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-bg-panel border border-border-main rounded text-[10px] text-text-secondary leading-tight opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                  Bounties are held in a secure Hedera Smart Contract escrow and
                  released only when you accept a solution.
                </div>
              </div>
            </div>

            {/* Currency Switcher */}
            <div className="flex p-0.5 rounded-md bg-bg-subtle border border-border-main">
              <button
                onClick={() => setCurrency("DVT")}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  currency === "DVT"
                    ? "bg-bg-panel text-primary-500 shadow-sm border border-border-main"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                DVT
              </button>
              <button
                onClick={() => setCurrency("HBAR")}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  currency === "HBAR"
                    ? "bg-bg-panel text-accent-500 shadow-sm border border-border-main"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                HBAR
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="relative w-full sm:w-48">
              <input
                type="number"
                value={bounty}
                onChange={(e) => setBounty(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-bg-subtle border border-border-main rounded-lg text-sm font-mono font-bold text-text-main outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
              />
              <span
                className={`absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-bold ${currency === "DVT" ? "text-primary-600" : "text-accent-600"}`}
              >
                {currency}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-border-main/50 sm:border-0 sm:pt-0">
              {(currency === "DVT"
                ? ["10", "25", "100", "500"]
                : ["1", "5", "10", "50"]
              ).map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBounty(amt)}
                  className={`px-3 py-1.5 rounded-md border text-[11px] font-mono transition-all ${
                    bounty === amt
                      ? "bg-primary-600/10 border-primary-500 text-primary-400"
                      : "bg-bg-subtle/50 border-border-main text-text-muted hover:border-text-secondary hover:text-text-secondary"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded bg-bg-subtle/50 border border-border-main/30">
            <div
              className={`w-1.5 h-1.5 rounded-full ${bounty ? "bg-primary-500 animate-pulse" : "bg-text-muted opacity-50"}`}
            />
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-tighter">
              {bounty
                ? `${bounty} ${currency} will be deducted from your wallet and locked in Escrow.`
                : "Questions with bounties receive 3x more technical engagement."}
            </p>
          </div>
        </div>

        {/* Body Editor placeholder */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
              Question Body (Markdown)
            </label>
            <div className="flex gap-2 text-[11px] text-text-muted">
              <span>Markdown Enabled</span>
            </div>
          </div>
          <div className="rounded-md border border-border-main overflow-hidden bg-bg-panel">
            <div className="flex items-center gap-1 px-2 py-1.5 bg-bg-subtle border-b border-border-main">
              {/* Simple toolbar mock */}
              {["B", "I", "<>", "Link", "List"].map((tool) => (
                <button
                  key={tool}
                  className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-medium text-text-secondary transition-colors"
                >
                  {tool}
                </button>
              ))}
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your technical challenge in detail. Provide code snippets if possible..."
              className="w-full h-64 p-4 bg-transparent outline-none text-[14px] text-text-secondary font-mono resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
            Tags (up to 5)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. solidity, smart-contracts, hedera-sdk"
            className="w-full px-4 py-2 bg-bg-panel border border-border-main rounded-md text-sm text-text-main outline-none focus:border-primary-500 transition-all font-mono"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border-main">
          <p className="text-[11px] text-text-muted max-w-[280px]">
            By posting, you agree to store this content on IPFS and its metadata
            on HCS.
          </p>
          <div className="flex gap-3">
            <Link
              href="/questions"
              className="px-5 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-main transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md text-sm font-bold text-white transition-all shadow-lg shadow-primary-600/10 active:scale-[0.98] ${
                isSubmitting
                  ? "bg-primary-800 cursor-wait opacity-70"
                  : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              {isSubmitting ? "Publishing…" : "Publish to Vault"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

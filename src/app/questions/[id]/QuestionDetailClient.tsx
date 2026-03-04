"use client";

import Link from "next/link";
import { Tag, Timestamp, Avatar } from "@/components/ui/primitives";
import { AnswerCard } from "@/components/cards/AnswerCard";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { useState, useRef } from "react";
import { TipModal } from "@/components/ui/TipModal";
import { useToast } from "@/components/ui/ToastContext";
import { useWallet } from "@/components/wallet/WalletProvider";
import {
  userPostAnswer,
  userSendVRSTip,
  userSendHBARTip,
  userAcceptAnswer,
  userPostReply,
} from "@/lib/hedera-client-tx";
import { releaseBounty } from "@/lib/hedera-contracts";
import type { LiveQuestion, LiveAnswer, LiveReply } from "@/lib/live-types";
import { useRouter } from "next/navigation";

interface QuestionDetailClientProps {
  question: LiveQuestion;
  answers: LiveAnswer[];
  repliesMap: Record<number, LiveReply[]>;
}

export function QuestionDetailClient({
  question,
  answers,
  repliesMap,
}: QuestionDetailClientProps) {
  const ANSWERS_PER_PAGE = 10;
  const [visibleAnswers, setVisibleAnswers] = useState(ANSWERS_PER_PAGE);

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    displayName: string;
    accountId: string;
  } | null>(null);
  const [isTipping, setIsTipping] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [answerBody, setAnswerBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVrsRelease, setPendingVrsRelease] = useState<{
    answererAccountId: string;
    amountVRS: number;
  } | null>(null);
  const [isRetryingVrs, setIsRetryingVrs] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const insertMarkdown = (
    before: string,
    after: string = "",
    placeholder: string = "text",
  ) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end) || placeholder;
    const newValue =
      el.value.slice(0, start) +
      before +
      selected +
      after +
      el.value.slice(end);
    setAnswerBody(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const { showToast } = useToast();
  const { accountId, connector, profile } = useWallet();
  const router = useRouter();

  const isQuestionAsker = accountId === question.author.accountId;
  const canAccept = isQuestionAsker && !question.accepted;

  const handleTip = (displayName: string, recipientAccountId: string) => {
    if (!accountId || !connector) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (recipientAccountId === accountId) {
      showToast("You cannot tip yourself.", "error");
      return;
    }
    setSelectedRecipient({ displayName, accountId: recipientAccountId });
    setIsTipModalOpen(true);
  };

  const confirmTip = async (amount: number, currency: "VRS" | "HBAR") => {
    if (!accountId || !connector || !selectedRecipient) return;
    setIsTipping(true);
    try {
      let txId: string;
      if (currency === "VRS") {
        const result = await userSendVRSTip(
          connector,
          accountId,
          selectedRecipient.accountId,
          amount,
        );
        txId = result.transactionId;
      } else {
        const result = await userSendHBARTip(
          connector,
          accountId,
          selectedRecipient.accountId,
          amount,
        );
        txId = result.transactionId;
      }
      setIsTipModalOpen(false);
      showToast(
        `Tipped ${amount} ${currency} to ${selectedRecipient.displayName}! TX: ${txId.slice(0, 24)}…`,
        "success",
      );
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Tip failed: ${msg}`, "error");
    } finally {
      setIsTipping(false);
    }
  };

  // Fetch the EVM address for a Hedera account ID from the Mirror Node.
  // Mirror Node returns evm_address as a 0x-prefixed hex string on every account.
  const fetchEvmAddress = async (
    hederaAccountId: string,
  ): Promise<string | null> => {
    const mirrorBase =
      process.env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
        ? "https://mainnet.mirrornode.hedera.com/api/v1"
        : "https://testnet.mirrornode.hedera.com/api/v1";
    try {
      const res = await fetch(`${mirrorBase}/accounts/${hederaAccountId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.evm_address ?? null;
    } catch {
      return null;
    }
  };

  const handleAcceptSolution = async (
    answerSequenceNumber: number,
    answererAccountId: string,
  ) => {
    if (!accountId || !connector) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!isQuestionAsker) {
      showToast("Only the question author can accept a solution.", "error");
      return;
    }
    setIsAccepting(true);
    try {
      const result = await userAcceptAnswer(connector, {
        discussionTopicId: question.discussionTopicId,
        acceptedMessageSequence: answerSequenceNumber,
        answererAccountId,
        askerAccountId: accountId,
      });
      showToast(
        `Solution accepted! TX: ${result.transactionId.slice(0, 24)}… It will appear shortly.`,
        "success",
      );

      // If there's a VRS bounty, release it server-side (operator → answerer)
      if (question.bountyAmount > 0 && question.bountyCurrency === "VRS") {
        try {
          const vrsRes = await fetch("/api/bounty/release-vrs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answererAccountId,
              amountVRS: question.bountyAmount,
              discussionTopicId: question.discussionTopicId,
            }),
          });
          const vrsData = await vrsRes.json();
          if (!vrsRes.ok && vrsData.error === "ANSWERER_NOT_ASSOCIATED") {
            setPendingVrsRelease({
              answererAccountId,
              amountVRS: question.bountyAmount,
            });
            showToast(
              `VRS release pending: ${answererAccountId} must associate with VRS first. Ask them to visit the Swap page, then use the Retry button.`,
              "error",
            );
            return;
          }
          if (!vrsRes.ok)
            throw new Error(
              vrsData.details ?? vrsData.error ?? "Release failed",
            );
          showToast(
            `${question.bountyAmount} VRS bounty released to ${answererAccountId}!`,
            "success",
          );
        } catch (vrsErr: unknown) {
          const msg = vrsErr instanceof Error ? vrsErr.message : String(vrsErr);
          showToast(`Answer accepted but VRS release failed: ${msg}`, "error");
        }
      }

      // If there's an HBAR bounty locked in the contract, release it
      if (question.bountyAmount > 0 && question.bountyCurrency === "HBAR") {
        // Resolve the answerer's EVM address from Mirror Node at release time
        const answererEvmAddress = await fetchEvmAddress(answererAccountId);
        if (!answererEvmAddress) {
          showToast(
            `Answer accepted but could not resolve EVM address for bounty release. Release manually.`,
            "error",
          );
        } else {
          try {
            await releaseBounty(connector, {
              accountId,
              topicId: question.discussionTopicId,
              sequenceNumber: 0, // must match what was used at lockBounty time (always 0 — discussionTopicId is already unique)
              recipientAddress: answererEvmAddress,
            });
            showToast(
              `Bounty of ${question.bountyAmount} HBAR released to ${answererAccountId}!`,
              "success",
            );
          } catch (bountyErr: unknown) {
            const bountyMsg =
              bountyErr instanceof Error
                ? bountyErr.message
                : String(bountyErr);
            // Non-fatal — ACCEPT was posted, bounty release failed
            showToast(
              `Answer accepted but bounty release failed: ${bountyMsg}. Release manually from contract.`,
              "error",
            );
          }
        }
      }

      // Trigger manual revalidation for the current page and the questions list
      try {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: window.location.pathname,
            secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
          }),
        });
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "/questions",
            secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
          }),
        });
      } catch (revalErr) {
        console.warn("Manual revalidation failed:", revalErr);
      }

      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to accept solution: ${msg}`, "error");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRetryVrsRelease = async () => {
    if (!pendingVrsRelease) return;
    setIsRetryingVrs(true);
    try {
      const res = await fetch("/api/bounty/release-vrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answererAccountId: pendingVrsRelease.answererAccountId,
          amountVRS: pendingVrsRelease.amountVRS,
          discussionTopicId: question.discussionTopicId,
        }),
      });
      const data = await res.json();
      if (!res.ok && data.error === "ANSWERER_NOT_ASSOCIATED") {
        showToast(
          `Still not associated. Ask ${pendingVrsRelease.answererAccountId} to visit the Swap page and associate with VRS first.`,
          "error",
        );
        return;
      }
      if (!res.ok)
        throw new Error(data.details ?? data.error ?? "Release failed");
      showToast(
        `${pendingVrsRelease.amountVRS} VRS bounty released to ${pendingVrsRelease.answererAccountId}!`,
        "success",
      );
      setPendingVrsRelease(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`VRS release failed: ${msg}`, "error");
    } finally {
      setIsRetryingVrs(false);
    }
  };

  const handleSubmitReply = async (answerSequenceNumber: number) => {
    if (!accountId || !connector) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!replyBody.trim()) {
      showToast("Reply cannot be empty.", "error");
      return;
    }
    setIsSubmittingReply(true);
    try {
      await userPostReply(connector, {
        discussionTopicId: question.discussionTopicId,
        replyToSequence: answerSequenceNumber,
        body: replyBody.trim(),
        author: {
          accountId,
          displayName: profile?.displayName ?? accountId,
        },
      });
      showToast("Reply posted!", "success");
      setReplyBody("");
      setReplyingTo(null);
      try {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: window.location.pathname,
            secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
          }),
        });
      } catch {}
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Reply failed: ${msg}`, "error");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!accountId || !connector) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!answerBody.trim()) {
      showToast("Answer body cannot be empty.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await userPostAnswer(connector, {
        questionSequenceNumber: question.sequenceNumber,
        discussionTopicId: question.discussionTopicId,
        body: answerBody,
        author: {
          accountId,
          displayName: profile?.displayName ?? accountId,
        },
      });

      showToast("Contribution posted on Hedera!", "success");
      setAnswerBody("");

      // Trigger manual revalidation for the current page
      try {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: window.location.pathname,
            secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
          }),
        });
      } catch (revalErr) {
        console.warn("Manual revalidation failed:", revalErr);
      }

      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || "Failed to post answer", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* Breadcrumbs / Back */}
      <Link
        href="/questions"
        className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-primary-500 transition-colors"
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
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Den
      </Link>

      {/* Pending VRS release banner — shown when association blocked the first attempt */}
      {pendingVrsRelease && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <div className="text-sm text-amber-300">
            <span className="font-semibold">VRS bounty not yet released.</span>{" "}
            {pendingVrsRelease.answererAccountId} needs to associate with VRS
            first (ask them to visit the Swap page), then click Retry.
          </div>
          <button
            onClick={handleRetryVrsRelease}
            disabled={isRetryingVrs}
            className="self-start sm:self-auto shrink-0 px-4 py-2 rounded-md text-sm font-medium bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50"
          >
            {isRetryingVrs
              ? "Retrying…"
              : `Retry — Release ${pendingVrsRelease.amountVRS} VRS`}
          </button>
        </div>
      )}

      {/* Question Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {question.accepted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-600/20 text-primary-400 border border-primary-600/30">
              Resolved
            </span>
          )}
          {question.bountyAmount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-500 border border-accent-500/30">
              {question.bountyAmount} {question.bountyCurrency} Bounty
            </span>
          )}
          <span className="text-[11px] font-mono text-text-muted ml-auto">
            HCS Topic: {question.discussionTopicId}
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-text-main leading-tight">
          {question.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border-main/50 pb-5">
          <div className="flex items-center gap-4">
            <Avatar
              accountId={question.author.accountId}
              displayName={question.author.displayName}
              size={32}
            />
            <div className="flex items-center h-full">
              <span className="text-border-main/50 self-stretch border-l border-border-main mx-2 ml-3" />
              <Timestamp iso={question.consensusTimestamp} />
            </div>
          </div>
          {/* <span className="text-border-main/50 self-stretch border-l border-border-main mx-1" /> */}
          {/* Tip the question author */}
          <button
            onClick={() =>
              handleTip(question.author.displayName, question.author.accountId)
            }
            className="sm:ml-auto text-xs font-medium text-text-muted hover:text-primary-400 transition-colors"
          >
            Tip Author
          </button>
        </div>
      </div>

      {/* Question Body */}
      <MarkdownBody content={question.body ?? ""} />

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {question.tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>

      {/* Answers Section */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-border-main pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
            {answers.length}{" "}
            {answers.length === 1 ? "Contribution" : "Contributions"}
          </h2>
        </div>

        <div className="space-y-4">
          {answers.length > 0 ? (
            <>
              {answers.slice(0, visibleAnswers).map((answer) => (
                <AnswerCard
                  key={answer.sequenceNumber}
                  answer={answer}
                  canAccept={canAccept && !answer.accepted}
                  isAccepting={isAccepting}
                  onTip={(displayName, recipientAccountId) =>
                    handleTip(displayName, recipientAccountId)
                  }
                  onAccept={() =>
                    handleAcceptSolution(
                      answer.sequenceNumber,
                      answer.author.accountId,
                    )
                  }
                  replies={repliesMap[answer.sequenceNumber] ?? []}
                  replyingTo={replyingTo === answer.sequenceNumber}
                  replyBody={
                    replyingTo === answer.sequenceNumber ? replyBody : ""
                  }
                  isSubmittingReply={isSubmittingReply}
                  onToggleReply={() =>
                    setReplyingTo((prev) =>
                      prev === answer.sequenceNumber
                        ? null
                        : answer.sequenceNumber,
                    )
                  }
                  onReplyBodyChange={setReplyBody}
                  onSubmitReply={() => handleSubmitReply(answer.sequenceNumber)}
                />
              ))}
              {visibleAnswers < answers.length && (
                <button
                  onClick={() => setVisibleAnswers((v) => v + ANSWERS_PER_PAGE)}
                  className="w-full py-3 rounded-lg text-sm font-medium border border-border-main hover:bg-bg-subtle transition-colors text-text-secondary"
                >
                  Show more ({answers.length - visibleAnswers} remaining)
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-text-muted">
              <p>No contributions yet. Be the first to answer!</p>
            </div>
          )}
        </div>
      </section>

      {/* Your Answer */}
      <section className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
          Your Contribution
        </h3>
        {accountId ? (
          <div className="rounded-md border border-border-main overflow-hidden bg-bg-panel">
            {/* Markdown toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-bg-subtle border-b border-border-main">
              <button
                onClick={() => insertMarkdown("**", "**", "bold")}
                type="button"
                title="Bold"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-bold text-text-secondary transition-colors"
              >
                B
              </button>
              <button
                onClick={() => insertMarkdown("_", "_", "italic")}
                type="button"
                title="Italic"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] italic text-text-secondary transition-colors"
              >
                I
              </button>
              <button
                onClick={() => insertMarkdown("`", "`", "code")}
                type="button"
                title="Inline code"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-mono text-text-secondary transition-colors"
              >
                &lt;&gt;
              </button>
              <button
                onClick={() => insertMarkdown("```\n", "\n```", "code here")}
                type="button"
                title="Code block"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] font-mono text-text-secondary transition-colors"
              >
                {"{}"}
              </button>
              <button
                onClick={() => insertMarkdown("[", "](url)", "link text")}
                type="button"
                title="Link"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] text-text-secondary transition-colors"
              >
                Link
              </button>
              <button
                onClick={() => insertMarkdown("- ", "", "item")}
                type="button"
                title="List item"
                className="px-2 py-0.5 rounded hover:bg-bg-hover text-[11px] text-text-secondary transition-colors"
              >
                List
              </button>
              <span className="ml-auto text-[10px] text-text-muted pr-1">
                Markdown
              </span>
            </div>
            <textarea
              ref={bodyRef}
              placeholder="Write your technical answer or suggestion here..."
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              disabled={isSubmitting}
              className="w-full h-40 p-4 bg-transparent outline-none text-sm text-text-secondary font-mono resize-none leading-relaxed disabled:opacity-50"
            />
            <div className="flex items-center justify-end px-4 py-3 border-t border-border-main bg-bg-subtle">
              <button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answerBody.trim()}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Signing…" : "Post Contribution"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border-main p-8 text-center bg-bg-panel/50">
            <p className="text-sm text-text-muted mb-4">
              Connect your wallet to post a contribution.
            </p>
          </div>
        )}
      </section>

      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        recipientName={selectedRecipient?.displayName ?? ""}
        onConfirm={confirmTip}
        isSubmitting={isTipping}
      />
    </div>
  );
}

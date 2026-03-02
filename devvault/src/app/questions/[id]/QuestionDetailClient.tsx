"use client";

import Link from "next/link";
import { Tag, Timestamp, StatPill } from "@/components/ui/primitives";
import { AnswerCard } from "@/components/cards/AnswerCard";
import { useState } from "react";
import { TipModal } from "@/components/ui/TipModal";
import { useToast } from "@/components/ui/ToastContext";
import { useWallet } from "@/components/wallet/WalletProvider";
import {
  userPostAnswer,
  userSendDVTTip,
  userSendHBARTip,
  userAcceptAnswer,
} from "@/lib/hedera-client-tx";
import { releaseBounty } from "@/lib/hedera-contracts";
import type { LiveQuestion, LiveAnswer } from "@/lib/live-types";
import { useRouter } from "next/navigation";

interface QuestionDetailClientProps {
  question: LiveQuestion;
  answers: LiveAnswer[];
}

export function QuestionDetailClient({
  question,
  answers,
}: QuestionDetailClientProps) {
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    displayName: string;
    accountId: string;
  } | null>(null);
  const [isTipping, setIsTipping] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [answerBody, setAnswerBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const { accountId, connector } = useWallet();
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

  const confirmTip = async (amount: number, currency: "DVT" | "HBAR") => {
    if (!accountId || !connector || !selectedRecipient) return;
    setIsTipping(true);
    try {
      let txId: string;
      if (currency === "DVT") {
        const result = await userSendDVTTip(
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
      setTimeout(() => router.refresh(), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Tip failed: ${msg}`, "error");
    } finally {
      setIsTipping(false);
    }
  };

  const handleAcceptSolution = async (
    answerSequenceNumber: number,
    answererAccountId: string,
    answererEvmAddress?: string,
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

      // If there's an HBAR bounty locked in the contract, release it
      if (
        question.bountyAmount > 0 &&
        question.bountyCurrency === "HBAR" &&
        answererEvmAddress
      ) {
        try {
          await releaseBounty(connector, {
            accountId,
            topicId: question.discussionTopicId,
            sequenceNumber: question.sequenceNumber,
            recipientAddress: answererEvmAddress,
          });
          showToast(
            `Bounty of ${question.bountyAmount} HBAR released to ${answererAccountId}!`,
            "success",
          );
        } catch (bountyErr: unknown) {
          const bountyMsg =
            bountyErr instanceof Error ? bountyErr.message : String(bountyErr);
          // Non-fatal — ACCEPT was posted, bounty release failed
          showToast(
            `Answer accepted but bounty release failed: ${bountyMsg}. Release manually from contract.`,
            "error",
          );
        }
      }

      setTimeout(() => router.refresh(), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to accept solution: ${msg}`, "error");
    } finally {
      setIsAccepting(false);
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
          displayName: accountId, // Replaced with HCS-11 display name once profiles are live
        },
      });

      showToast(
        "Contribution posted on Hedera! It will appear shortly.",
        "success",
      );
      setAnswerBody("");
      setTimeout(() => router.refresh(), 3000);
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

        <div className="flex items-center gap-4 border-b border-border-main pb-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 bg-primary-800 text-primary-300">
              {question.author.displayName.charAt(0).toUpperCase()}
            </span>
            <span className="text-xs font-medium text-text-main">
              {question.author.displayName}
            </span>
          </div>
          <span className="text-border-main">|</span>
          <Timestamp iso={question.consensusTimestamp} />
          <span className="text-border-main">|</span>
          <StatPill
            value={question.tipTotal ?? 0}
            label="DVT Tipped"
            variant="primary"
          />
          {/* Tip the question author */}
          <button
            onClick={() =>
              handleTip(question.author.displayName, question.author.accountId)
            }
            className="ml-auto text-xs font-medium text-text-muted hover:text-primary-400 transition-colors"
          >
            Tip Author
          </button>
        </div>
      </div>

      {/* Question Body */}
      <div className="text-[15px] leading-relaxed text-text-secondary whitespace-pre-wrap font-sans">
        {question.body}
      </div>

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
            answers.map((answer) => (
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
              />
            ))
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
          <div className="rounded-lg border border-border-main bg-bg-panel p-4">
            <textarea
              placeholder="Write your technical answer or suggestion here..."
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              disabled={isSubmitting}
              className="w-full h-32 bg-transparent border-none outline-none text-sm text-text-primary resize-none font-mono disabled:opacity-50"
            />
            <div className="flex items-center justify-between mt-4 border-t border-border-main pt-4">
              <div className="flex gap-2">
                <button className="p-1.5 rounded hover:bg-bg-subtle text-text-muted transition-colors">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answerBody.trim()}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Signing..." : "Post Contribution"}
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

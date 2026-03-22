"use client";

import { useState } from "react";
import type { LiveComment, LiveReply } from "@/lib/live-types";
import { CommentCard } from "@/components/cards/CommentCard";
import { TipModal } from "@/components/ui/TipModal";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/ui/ToastContext";
import {
  userSendVRSTip,
  userSendHBARTip,
  userPostReply,
} from "@/lib/hedera-client-tx";
import { useRouter } from "next/navigation";

interface Props {
  discussionTopicId: string;
  comments: LiveComment[];
  repliesMap: Record<number, LiveReply[]>;
}

export function UpdateCommentsClient({
  discussionTopicId,
  comments,
  repliesMap,
}: Props) {
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    displayName: string;
    accountId: string;
  } | null>(null);

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const { accountId, isConnected, connector, profile } = useWallet();
  const { showToast } = useToast();
  const router = useRouter();

  const handleTip = (displayName: string, recipientAccountId: string) => {
    if (!isConnected || !accountId || !connector) {
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
      if (currency === "VRS") {
        await userSendVRSTip(
          connector,
          accountId,
          selectedRecipient.accountId,
          amount,
        );
      } else {
        await userSendHBARTip(
          connector,
          accountId,
          selectedRecipient.accountId,
          amount,
        );
      }
      setIsTipModalOpen(false);
      showToast(
        `Successfully tipped ${amount} ${currency} to ${selectedRecipient.displayName}!`,
        "success",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("REJECTED")) {
        showToast("Tip cancelled in wallet", "error");
      } else {
        showToast(`Tip failed: ${msg}`, "error");
      }
    } finally {
      setIsTipping(false);
    }
  };

  const handleSubmitReply = async (commentSequenceNumber: number) => {
    if (!isConnected || !accountId || !connector) {
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
        discussionTopicId,
        replyToSequence: commentSequenceNumber,
        body: replyBody.trim(),
        author: {
          accountId,
          displayName: profile?.displayName ?? accountId,
        },
      });

      showToast("Reply posted successfully!", "success");
      setReplyBody("");
      setReplyingTo(null);

      // Trigger automatic revalidation without full window reload
      try {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: window.location.pathname,
            secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET,
          }),
        });
      } catch (e) {
        console.warn("Manual revalidation failed", e);
      }

      router.refresh(); // Refresh page to see new reply
    } catch (err) {
      console.error("Failed to post reply:", err);
      showToast(`Failed to post reply: ${String(err)}`, "error");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentCard
          key={comment.sequenceNumber}
          comment={comment}
          onTip={handleTip}
          onReply={() =>
            setReplyingTo((prev) =>
              prev === comment.sequenceNumber ? null : comment.sequenceNumber,
            )
          }
          replyingTo={replyingTo === comment.sequenceNumber}
          replyBody={replyingTo === comment.sequenceNumber ? replyBody : ""}
          isSubmittingReply={isSubmittingReply}
          onReplyBodyChange={setReplyBody}
          onSubmitReply={() => handleSubmitReply(comment.sequenceNumber)}
          replies={repliesMap[comment.sequenceNumber] ?? []}
        />
      ))}

      {selectedRecipient && (
        <TipModal
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          recipientName={selectedRecipient.displayName}
          onConfirm={confirmTip}
          isSubmitting={isTipping}
        />
      )}
    </div>
  );
}

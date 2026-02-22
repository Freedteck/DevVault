"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Code, Send, Coins } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Hbar, TransferTransaction, AccountId } from "@hashgraph/sdk";

import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import MarkdownEditor from "../ui/MarkdownEditor";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import AnswerCardNew from "../features/AnswerCardNew";
import TipModal from "../features/TipModal";
import ArbitrationTimer from "../features/ArbitrationTimer";
import DetailSkeleton from "../features/DetailSkeleton";

import { userWalletContext } from "../../context/userWalletContext";
import {
  submitAnswer,
  submitAcceptance,
  releaseEscrow,
} from "../../services/hcsService";
import styles from "./QuestionDetails.module.css";

interface QuestionDetailsProps {
  initialQuestion?: any;
  initialAnswers?: any[];
}

const QuestionDetailsNew = ({
  initialQuestion,
  initialAnswers,
}: QuestionDetailsProps) => {
  const params = useParams();
  const sequenceNumber = params?.sequenceNumber as string;
  const { accountId, walletData } = useContext(userWalletContext);

  const [question, setQuestion] = useState<any>(initialQuestion || null);
  const [answers, setAnswers] = useState<any[]>(initialAnswers || []);
  const [isLoading, setIsLoading] = useState(!initialQuestion);
  const [error, setError] = useState<any>(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState<any>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAnswers = useCallback(async (questionId: string) => {
    try {
      const res = await fetch(`/api/answers/${questionId}`);
      if (!res.ok) return [];
      return res.json();
    } catch (err) {
      console.error("Error loading answers:", err);
      return [];
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!sequenceNumber) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/questions/${sequenceNumber}`);
      if (!res.ok) throw new Error("Failed to fetch question");
      const questionData = await res.json();
      setQuestion(questionData);

      const answersData = await loadAnswers(questionData.questionId);
      setAnswers(answersData);
    } catch (err: any) {
      console.error("Error refreshing question data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sequenceNumber, loadAnswers]);

  useEffect(() => {
    if (!initialQuestion && sequenceNumber) {
      refreshData();
    }
  }, [sequenceNumber, initialQuestion, refreshData]);

  const handleOpenTip = (authorName: any) => {
    setTipTarget(authorName);
    setIsTipModalOpen(true);
  };

  const handleAcceptAnswer = async (answer: any) => {
    if (!accountId || !walletData) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (accountId !== question.author.username) {
      toast.error("Only the question author can accept answers");
      return;
    }

    try {
      toast.loading("Accepting answer...");

      await submitAcceptance(
        {
          questionId: question.questionId,
          answerId: answer.answerId,
        },
        walletData,
        accountId,
      );

      if (question.bounty && question.bounty > 0) {
        const escrowContractId = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID;
        if (escrowContractId) {
          try {
            await releaseEscrow(
              walletData,
              accountId,
              escrowContractId,
              question.questionId,
              answer.author.username,
            );
            toast.dismiss();
            toast.success(
              `Answer accepted! ${question.bounty} HBAR released to ${answer.author.username}`,
            );
          } catch (escrowError) {
            console.error("Escrow release error:", escrowError);
            toast.dismiss();
            toast.success("Answer accepted! (Escrow release pending)");
          }
        } else {
          toast.dismiss();
          toast.success("Answer accepted!");
        }
      } else {
        toast.dismiss();
        toast.success("Answer accepted!");
      }

      setTimeout(async () => {
        const refreshed = await loadAnswers(question.questionId);
        setAnswers(refreshed);
      }, 2000);
    } catch (error) {
      console.error("Error accepting answer:", error);
      toast.dismiss();
      toast.error("Failed to accept answer");
    }
  };

  const handleAnswerSubmit = async () => {
    if (!accountId || !walletData) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!answerContent.trim()) {
      toast.error("Please enter your answer");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitAnswer(
        {
          questionId: question.questionId,
          content: answerContent,
          isAI: false,
          confidence: null,
        },
        walletData,
        accountId,
      );

      toast.success("Answer submitted successfully!");
      setAnswerContent("");

      setTimeout(async () => {
        const refreshed = await loadAnswers(question.questionId);
        setAnswers(refreshed);
      }, 2000);
    } catch (err) {
      console.error("Error submitting answer:", err);
      toast.error("Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTipConfirm = async (amount: any) => {
    try {
      if (!accountId || !walletData) {
        toast.error("Please connect your wallet first");
        return;
      }

      toast.loading(`Sending ${amount} HBAR to ${tipTarget}...`);

      const signer = (walletData as any).getSigner(
        AccountId.fromString(accountId),
      );
      const hbarAmount = new Hbar(Number(amount));
      const transaction = new TransferTransaction()
        .addHbarTransfer(accountId, hbarAmount.negated())
        .addHbarTransfer(tipTarget, hbarAmount);

      await signer.call(transaction);

      toast.dismiss();
      toast.success(`Successfully sent ${amount} HBAR to ${tipTarget}`);
      setIsTipModalOpen(false);
    } catch (error: any) {
      console.error("Tip transfer error:", error);
      toast.dismiss();
      toast.error(`Failed to send tip: ${error.message}`);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !question) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to load question: {error || "Question not found"}</p>
          <Link href="/questions">
            <NeonButton>Back to Questions</NeonButton>
          </Link>
        </div>
      </div>
    );
  }

  const hasAcceptedAnswer = answers.some((a) => a.isAccepted);

  return (
    <div className={styles.container}>
      <Link href="/questions" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Feed
      </Link>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <GlassCard className={styles.questionCard}>
            <h1 className={styles.title}>{question.title}</h1>

            <div className={styles.meta}>
              <div className={styles.author}>
                <img
                  src={question.author.avatar}
                  alt={question.author.username}
                  className={styles.avatar}
                />
                <span className={styles.username}>
                  {question.author.username}
                </span>
              </div>
              <span className={styles.dot}>•</span>
              <span className={styles.date}>
                <Clock size={14} />{" "}
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
              <span className={styles.dot}>•</span>
              <div className={styles.tags}>
                {question.tags.map((t: any) => (
                  <span key={t} className={styles.tag}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <MarkdownRenderer
              content={question.description}
              className={styles.description}
            />

            {question.codeSnippet && (
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>
                  <Code size={14} /> Code Snippet
                </div>
                <MarkdownRenderer content={question.codeSnippet} />
              </div>
            )}

            <div className={styles.bountyBar}>
              <span className={styles.bountyLabel}>Bounty Reward</span>
              <span className={styles.bountyValue}>
                <Coins size={18} /> {question.bounty} HBAR
              </span>
            </div>
          </GlassCard>

          {question.bounty > 0 && !hasAcceptedAnswer && (
            <ArbitrationTimer
              questionCreatedAt={question.createdAt}
              hasBounty={question.bounty > 0}
              hasAcceptedAnswer={hasAcceptedAnswer}
              arbitrationDelay={7 * 24 * 60 * 60 * 1000}
              onArbitrationTrigger={() => {
                toast(
                  "⚖️ Arbitration window reached. The AI Arbiter will evaluate all answers and release the bounty automatically.",
                  { duration: 6000 },
                );
              }}
            />
          )}

          <div className={styles.divider} />

          <h3 className={styles.sectionTitle}>
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h3>

          <div className={styles.answersList}>
            {answers.map((ans) => (
              <AnswerCardNew
                key={ans.answerId}
                answer={ans}
                isAccepted={ans.isAccepted}
                onTip={() => handleOpenTip(ans.author.username)}
                onAccept={
                  accountId === question.author.username && !hasAcceptedAnswer
                    ? () => handleAcceptAnswer(ans)
                    : undefined
                }
              />
            ))}
          </div>

          <GlassCard className={styles.postArea}>
            <h3 className={styles.postTitle}>Post a Solution</h3>
            <MarkdownEditor
              value={answerContent}
              onChange={(value: any) => setAnswerContent(value)}
              placeholder="Type your solution here. Markdown supported: **bold**, `code`, [links](url), etc."
              minRows={6}
            />
            <div className={styles.postActions}>
              <NeonButton
                icon={<Send size={16} />}
                onClick={handleAnswerSubmit}
                disabled={isSubmitting || !accountId || !answerContent.trim()}
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </NeonButton>
            </div>
          </GlassCard>
        </div>

        <aside className={styles.sidebar}>
          <GlassCard className={styles.sidebarCard}>
            <h4>About the Author</h4>
            <div className={styles.author} style={{ marginTop: "1rem" }}>
              <img
                src={question.author.avatar}
                alt={question.author.username}
                className={styles.avatar}
              />
              <div>
                <div className={styles.username}>
                  {question.author.username}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.6)",
                    marginTop: "4px",
                  }}
                >
                  {question.author.rank || "Contributor"}
                </div>
              </div>
            </div>
          </GlassCard>
        </aside>
      </div>

      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        targetName={tipTarget}
        onConfirm={handleTipConfirm}
      />
    </div>
  );
};

export default QuestionDetailsNew;

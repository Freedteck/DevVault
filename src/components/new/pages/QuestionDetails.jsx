import { useState, useEffect, useContext, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Code, Send, Coins } from "lucide-react";
import toast from "react-hot-toast";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import MarkdownEditor from "../ui/MarkdownEditor";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import AnswerCardNew from "../features/AnswerCardNew";
import TipModal from "../features/TipModal";
import ArbitrationTimer from "../features/ArbitrationTimer";
import {
  fetchQuestionBySequenceNumber,
  fetchAnswersForQuestion,
  fetchAcceptances,
} from "../../../services/fetchService";
import { processArbitration } from "../../../services/aiArbiter";
import { userWalletContext } from "../../../context/userWalletContext";
import styles from "./QuestionDetails.module.css";

const QuestionDetailsNew = () => {
  const { id: sequenceNumber } = useParams();
  const { accountId, walletData } = useContext(userWalletContext);

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState(null);
  const [answerContent, setAnswerContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isArbitratingRef = useRef(false);

  const gateway = import.meta.env.VITE_PINATA_GATEWAY;

  // Fetch question and answers
  useEffect(() => {
    const loadQuestionData = async () => {
      try {
        setIsLoading(true);

        // Fetch question by sequence number
        const questionData = await fetchQuestionBySequenceNumber(
          parseInt(sequenceNumber),
          gateway,
        );
        setQuestion(questionData);

        // Fetch answers using questionId
        const answersData = await fetchAnswersForQuestion(
          questionData.questionId,
          gateway,
        );
        setAnswers(answersData);
      } catch (err) {
        console.error("Error loading question:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (sequenceNumber) {
      loadQuestionData();
    }
  }, [sequenceNumber, gateway]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to load question: {error || "Question not found"}</p>
          <Link to="/questions">
            <NeonButton>Back to Questions</NeonButton>
          </Link>
        </div>
      </div>
    );
  }

  const hasAcceptedAnswer = answers.some((a) => a.isAccepted);

  const handleOpenTip = (authorName) => {
    setTipTarget(authorName);
    setIsTipModalOpen(true);
  };

  const handleAcceptAnswer = async (answer) => {
    if (!accountId || !walletData) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if user is question author
    if (accountId !== question.author.username) {
      toast.error("Only the question author can accept answers");
      return;
    }

    try {
      toast.loading("Accepting answer...");

      // 1. Submit acceptance to HCS
      const { submitAcceptance, releaseEscrow } =
        await import("../../../services/hcsService");

      await submitAcceptance(
        {
          questionId: question.questionId,
          answerId: answer.answerId,
        },
        walletData,
        accountId,
      );

      // 2. Release escrow if bounty exists
      if (question.bounty && question.bounty > 0) {
        const escrowContractId = import.meta.env.VITE_ESCROW_CONTRACT_ID;
        if (escrowContractId) {
          try {
            await releaseEscrow(
              walletData,
              accountId,
              escrowContractId,
              question.questionId,
              answer.author.username, // Author's account ID
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

      // 3. Refresh answers to show accepted status
      setTimeout(async () => {
        const answersData = await fetchAnswersForQuestion(
          question.questionId,
          gateway,
        );
        setAnswers(answersData);
      }, 2000);
    } catch (error) {
      console.error("Error accepting answer:", error);
      toast.dismiss();
      toast.error("Failed to accept answer");
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/questions" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Feed
      </Link>

      <div className={styles.layout}>
        {/* Main Content */}
        <div className={styles.mainColumn}>
          {/* Question Full Card */}
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
                {/* Asker reputation NOT shown here intentionally */}
              </div>
              <span className={styles.dot}>•</span>
              <span className={styles.date}>
                <Clock size={14} />{" "}
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
              <span className={styles.dot}>•</span>
              <div className={styles.tags}>
                {question.tags.map((t) => (
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

          {/* Arbitration Timer (if bounty exists and no accepted answer) */}
          {question.bounty > 0 && !hasAcceptedAnswer && (
            <ArbitrationTimer
              questionCreatedAt={question.createdAt}
              hasBounty={question.bounty > 0}
              hasAcceptedAnswer={hasAcceptedAnswer}
              arbitrationDelay={7 * 24 * 60 * 60 * 1000} // 7 days
              onArbitrationTrigger={async () => {
                // Prevent concurrent/repeated arbitration calls
                if (isArbitratingRef.current) return;
                isArbitratingRef.current = true;
                try {
                  toast.loading("AI Arbiter analyzing answers...");

                  // Get acceptances to check eligibility
                  const acceptances = await fetchAcceptances();

                  // Process arbitration
                  const result = await processArbitration(
                    question,
                    answers,
                    acceptances,
                  );

                  if (result) {
                    toast.dismiss();
                    toast.success(
                      `AI Arbiter released ${question.bounty} HBAR to ${result.winnerAccountId}`,
                    );

                    // Mark bounty as released so the timer stops
                    setQuestion((q) => ({ ...q, bounty: 0 }));

                    // Reload answers to show arbitration badge
                    const answersData = await fetchAnswersForQuestion(
                      question.questionId,
                      gateway,
                    );
                    setAnswers(answersData);
                  } else {
                    toast.dismiss();
                    toast.error("Question not eligible for arbitration yet");
                  }
                } catch (error) {
                  console.error("Arbitration error:", error);
                  toast.dismiss();
                  toast.error(`Arbitration failed: ${error.message}`);
                } finally {
                  isArbitratingRef.current = false;
                }
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

          {/* Post Answer Area */}
          <GlassCard className={styles.postArea}>
            <h3 className={styles.postTitle}>Post a Solution</h3>
            <MarkdownEditor
              value={answerContent}
              onChange={(value) => setAnswerContent(value)}
              placeholder="Type your solution here. Markdown supported: **bold**, `code`, [links](url), etc."
              minRows={6}
            />
            <div className={styles.postActions}>
              <NeonButton
                icon={<Send size={16} />}
                onClick={async () => {
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
                    const { submitAnswer } =
                      await import("../../../services/hcsService");

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

                    // Clear form
                    setAnswerContent("");

                    // Reload answers after delay for mirror node
                    setTimeout(async () => {
                      const answersData = await fetchAnswersForQuestion(
                        question.questionId,
                        gateway,
                      );
                      setAnswers(answersData);
                    }, 2000);
                  } catch (err) {
                    console.error("Error submitting answer:", err);
                    toast.error("Failed to submit answer");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting || !accountId || !answerContent.trim()}
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </NeonButton>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <GlassCard className={styles.sidebarCard}>
            <h4>Browse by Tag</h4>
            <ul className={styles.linkList}>
              {question.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    to={`/questions`}
                    style={{ color: "var(--apex-primary-400)" }}
                  >
                    #{tag}
                  </Link>
                </li>
              ))}
            </ul>
          </GlassCard>
        </aside>
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        targetName={tipTarget}
        onConfirm={async (amount) => {
          try {
            if (!accountId || !walletData) {
              toast.error("Please connect your wallet first");
              return;
            }

            toast.loading(`Sending ${amount} HBAR to ${tipTarget}...`);

            // Use DAppConnector for HBAR transfer
            const { Hbar, TransferTransaction } =
              await import("@hashgraph/sdk");
            const { AccountId } = await import("@hashgraph/sdk");

            const signer = walletData.getSigner(
              AccountId.fromString(accountId),
            );
            const transaction = new TransferTransaction()
              .addHbarTransfer(accountId, Hbar.from(-amount))
              .addHbarTransfer(tipTarget, Hbar.from(amount));

            await signer.call(transaction);

            toast.dismiss();
            toast.success(`Successfully sent ${amount} HBAR to ${tipTarget}`);
            setIsTipModalOpen(false);
          } catch (error) {
            console.error("Tip transfer error:", error);
            toast.dismiss();
            toast.error(`Failed to send tip: ${error.message}`);
          }
        }}
      />
    </div>
  );
};

export default QuestionDetailsNew;

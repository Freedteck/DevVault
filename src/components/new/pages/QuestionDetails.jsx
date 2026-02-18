import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Code, Send } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import AnswerCardNew from "../features/AnswerCardNew";
import TipModal from "../features/TipModal";
import ArbitrationTimer from "../features/ArbitrationTimer";
import {
  fetchQuestionBySequenceNumber,
  fetchAnswersForQuestion,
} from "../../../services/fetchService";
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

            <p className={styles.description}>{question.description}</p>

            {question.codeSnippet && (
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>
                  <Code size={14} /> Code Snippet
                </div>
                <pre>
                  <code>{question.codeSnippet}</code>
                </pre>
              </div>
            )}

            <div className={styles.bountyBar}>
              <span className={styles.bountyLabel}>Bounty Reward</span>
              <span className={styles.bountyValue}>
                💎 {question.bounty} HBAR
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
              onArbitrationTrigger={() => {
                console.log("AI arbiter should analyze answers now");
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
              />
            ))}
          </div>

          {/* Post Answer Area */}
          <GlassCard className={styles.postArea}>
            <h3 className={styles.postTitle}>Post a Solution</h3>
            <textarea
              className={styles.textarea}
              placeholder="Type your solution here. Markdown supported..."
              rows={6}
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
            />
            <div className={styles.postActions}>
              <NeonButton
                icon={<Send size={16} />}
                onClick={async () => {
                  if (!accountId || !walletData) {
                    const toast = (await import("react-hot-toast")).default;
                    toast.error("Please connect your wallet first");
                    return;
                  }

                  if (!answerContent.trim()) {
                    const toast = (await import("react-hot-toast")).default;
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

                    const toast = (await import("react-hot-toast")).default;
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
                    const toast = (await import("react-hot-toast")).default;
                    toast.error("Failed to submit answer");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </NeonButton>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <GlassCard className={styles.sidebarCard}>
            <h4>Similar Questions</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="#">HTS Token Transfers failing</a>
              </li>
              <li>
                <a href="#">Smart Contract verify on Mirror Node</a>
              </li>
            </ul>
          </GlassCard>
        </aside>
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        targetName={tipTarget}
        onConfirm={(amount) => {
          import("react-hot-toast").then(({ default: toast }) => {
            toast.success(`Successfully sent ${amount} HBAR to ${tipTarget}`);
          });
          setIsTipModalOpen(false);
        }}
      />
    </div>
  );
};

export default QuestionDetailsNew;

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Code, Send } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import AnswerCardNew from "../features/AnswerCardNew";
import TipModal from "../features/TipModal";
import BountyModal from "../features/BountyModal";
import AIResponse from "../features/AIResponse";
import ArbitrationTimer from "../features/ArbitrationTimer";
import { MOCK_QUESTIONS, MOCK_USERS } from "../data/mock";
import styles from "./QuestionDetails.module.css";

const QuestionDetailsNew = () => {
  const { id } = useParams();
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState(null);
  const [showBountyForm, setShowBountyForm] = useState(false);

  const question = MOCK_QUESTIONS.find((q) => q.id === id) || MOCK_QUESTIONS[0];

  // Mock answers logic (in reality comes from HCS)
  const answers = [
    {
      id: 101,
      author: MOCK_USERS.users[1], // Expert
      content:
        "You need to ensure the polyfill is imported *before* anything else in your entry file (index.js). Also, Expo requires a specific metro config setup for node modules.",
      createdAt: "2024-02-14T12:00:00Z",
      likes: 12,
      isAccepted: true,
    },
    {
      id: 102,
      author: MOCK_USERS.users[0], // Contributor
      content:
        "Have you checked the 'react-native-quick-crypto' library? It is much faster than the standard random values polyfill and works better with Hedera SDK.",
      createdAt: "2024-02-14T13:30:00Z",
      likes: 5,
      isAccepted: false,
    },
  ];

  const hasAcceptedAnswer = answers.some((a) => a.isAccepted);

  // Mock AI response data (will be fetched from Groq via Agent Kit)
  const [aiResponse] = useState({
    answer: `<p>The issue is related to how React Native handles crypto modules. Here's the solution:</p>
    <pre><code>// 1. Install the polyfill
npm install react-native-get-random-values

// 2. Import at the TOP of index.js (before anything else)
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';

// 3. Then import Hedera SDK
import { Client } from '@hashgraph/sdk';
    </code></pre>
    <p>This ensures the crypto polyfill is loaded before the Hedera SDK tries to use it.</p>`,
    confidence: 85, // Change to <50 to see "Needs Human" flow, 50-80 for caution, >80 for high confidence
    reasoning:
      "This appears to be a complex debugging issue that requires hands-on testing with your specific React Native setup and dependencies. A human expert familiar with Expo and Hedera SDK integration would provide better assistance.",
  });

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

          {/* AI Instant Answer */}
          <AIResponse
            questionId={question.id}
            answer={aiResponse.answer}
            confidence={aiResponse.confidence}
            reasoning={aiResponse.reasoning}
            isLoading={false}
            onPostBounty={() => setShowBountyForm(true)}
            onRate={(qId, helpful) => {
              console.log(
                `User rated AI answer for Q${qId}: ${helpful ? "helpful" : "not helpful"}`,
              );
            }}
          />

          <div className={styles.divider} />

          <h3 className={styles.sectionTitle}>
            {answers.length} Human {answers.length === 1 ? "Answer" : "Answers"}
          </h3>

          <div className={styles.answersList}>
            {answers.map((ans) => (
              <AnswerCardNew
                key={ans.id}
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
            />
            <div className={styles.postActions}>
              <NeonButton icon={<Send size={16} />}>Submit Answer</NeonButton>
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

      {/* Bounty Modal */}
      <BountyModal
        isOpen={showBountyForm}
        onClose={() => setShowBountyForm(false)}
        onConfirm={(amount) => {
          import("react-hot-toast").then(({ default: toast }) => {
            toast.success(`Question posted with ${amount} HBAR bounty!`);
          });
          setShowBountyForm(false);
        }}
      />
    </div>
  );
};

export default QuestionDetailsNew;

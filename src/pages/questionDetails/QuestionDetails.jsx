import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, MessageCircle, Heart, Send } from "lucide-react";
import { userWalletContext } from "../../context/userWalletContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import UserWithBadge from "../../components/ui/UserWithBadge";
import AcceptAnswerButton from "../../components/acceptButton/AcceptAnswerButton";
import topicMessageFnc from "../../client/topicMessage";
import tokenTransferFcn from "../../client/tokenTransfer";
import acceptAnswer from "../../client/acceptAnswer";
import hbarTransferFnc from "../../client/hbarTransfer";
import { useAnswers, useAcceptances } from "../../hooks/useHCSData";
import styles from "./QuestionDetails.module.css";

const QuestionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { accountId: userAccountId, walletData } =
    useContext(userWalletContext);

  const [question, setQuestion] = useState(location.state?.question || null);
  const { data: comments, refetch: refetchAnswers } = useAnswers(id);
  const { data: acceptances, refetch: refetchAcceptances } = useAcceptances(id);
  const [newComment, setNewComment] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipTarget, setTipTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenId = import.meta.env.VITE_TOKEN_ID;
  const topicId = import.meta.env.VITE_QUESTIONS_TOPIC_ID;
  const answersTopicId = import.meta.env.VITE_ANSWERS_TOPIC_ID;
  const acceptancesTopicId = import.meta.env.VITE_ACCEPTANCES_TOPIC_ID;

  useEffect(() => {
    const fetchQuestion = async () => {
      // Fetch question if not passed via state
      if (!question) {
        try {
          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages/${id}`
          );
          const data = await response.json();

          try {
            const decodedMessage = atob(data.message);
            const parsedQuestion = JSON.parse(decodedMessage);
            setQuestion({
              ...parsedQuestion,
              sequence_number: data.sequence_number,
              consensus_timestamp: data.consensus_timestamp,
            });
          } catch (error) {
            console.error("Failed to parse question:", error);
          }
        } catch (error) {
          console.error("Failed to fetch question:", error);
        }
      }
      setIsLoading(false);
    };

    fetchQuestion();
  }, [id, question, topicId]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || !userAccountId) {
      alert("Please connect your wallet and enter a comment");
      return;
    }

    setIsSubmitting(true);

    try {
      const metaData = {
        commentsId: id, // This is now sequence_number from URL
        text: newComment,
        icon: "https://cryptologos.cc/logos/hedera-hbar-logo.png",
        date: new Date().toISOString(),
        accountId: userAccountId,
      };

      await topicMessageFnc(
        walletData,
        userAccountId,
        answersTopicId,
        metaData
      );

      setNewComment("");

      // Refetch answers to get fresh data from HCS
      await refetchAnswers();
    } catch (error) {
      console.error("Failed to submit comment:", error);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTip = async () => {
    if (!tipAmount || !userAccountId || !tipTarget) {
      alert("Please enter a tip amount");
      return;
    }

    try {
      const [status] = await tokenTransferFcn(
        walletData,
        userAccountId,
        tipTarget,
        parseInt(tipAmount),
        tokenId
      );

      if (status === "SUCCESS") {
        alert(`Successfully tipped ${tipAmount} DVT tokens!`);
        setShowTipModal(false);
        setTipAmount("");
        setTipTarget(null);
      }
    } catch (error) {
      console.error("Failed to send tip:", error);
      alert("Failed to send tip. Please try again.");
    }
  };

  const openTipModal = (accountId) => {
    setTipTarget(accountId);
    setShowTipModal(true);
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!userAccountId) {
      alert("Please connect your wallet to accept answers");
      return;
    }

    // Check if this answer is already accepted
    const isAlreadyAccepted = acceptances.some(
      (acceptance) => acceptance.answerId === answerId
    );

    if (isAlreadyAccepted) {
      alert("This answer has already been accepted");
      return;
    }

    // Find the answer by sequence_number
    const answer = comments.find(
      (comment) => comment.sequence_number === answerId
    );
    if (!answer) {
      alert("Answer not found");
      return;
    }

    // Check if user is trying to accept their own answer
    if (answer.accountId === userAccountId) {
      alert("You cannot accept your own answer");
      return;
    }

    try {
      // Transfer bounty to answer author if bounty exists
      if (question.bounty && question.bounty > 0) {
        await hbarTransferFnc(
          walletData,
          userAccountId,
          answer.accountId,
          question.bounty.toString()
        );
      }

      const acceptanceData = {
        type: "acceptance",
        questionId: id, // This is the question's sequence_number
        answerId: answerId, // This is the answer's sequence_number
        answerAuthor: answer.accountId,
        acceptedBy: userAccountId,
        timestamp: Date.now(),
      };

      await acceptAnswer(
        walletData,
        userAccountId,
        acceptancesTopicId,
        acceptanceData
      );

      // Refetch acceptances to get fresh data from HCS
      await refetchAcceptances();
    } catch (error) {
      console.error("Failed to accept answer:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      alert(`Failed to accept answer: ${error.message || "Please try again."}`);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.questionDetails}>
        <div className={styles.loading}>Loading question...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className={styles.questionDetails}>
        <div className={styles.notFound}>
          <h2>Question not found</h2>
          <Button onClick={() => navigate("/discussions")}>
            Back to Questions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.questionDetails}>
      <Button
        variant="ghost"
        onClick={() => navigate("/discussions")}
        className={styles.backButton}
        icon={<ArrowLeft size={20} />}
        iconPosition="left"
      >
        Back to Questions
      </Button>

      <Card className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <h1 className={styles.title}>{question.title}</h1>
          <div className={styles.tags}>
            {question.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
            {question.bounty > 0 && (
              <Badge variant="success" className={styles.bountyBadge}>
                {question.bounty} HBAR Bounty
              </Badge>
            )}
          </div>
        </div>

        <p className={styles.description}>{question.description}</p>

        <div className={styles.meta}>
          <UserWithBadge accountId={question.accountId} size="sm" />
          <div className={styles.metaItem}>
            <Calendar size={16} />
            <span>{new Date(question.date).toLocaleDateString()}</span>
          </div>
          <div className={styles.metaItem}>
            <MessageCircle size={16} />
            <span>{comments.length} answers</span>
          </div>
        </div>

        <div className={styles.tipSection}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTipModal(question.accountId)}
          >
            <Heart size={16} />
            Tip Author
          </Button>
        </div>
      </Card>

      <div className={styles.answersSection}>
        <h2 className={styles.answersTitle}>
          {comments.length} {comments.length === 1 ? "Answer" : "Answers"}
        </h2>
        {comments.length > 0 && (
          <div className={styles.answersList}>
            {comments.map((comment) => {
              const answerId = comment.sequence_number;
              const isAccepted = acceptances.some(
                (acceptance) => acceptance.answerId === answerId
              );

              return (
                <Card
                  key={comment.sequence_number}
                  className={styles.answerCard}
                >
                  <div className={styles.answerHeader}>
                    <UserWithBadge accountId={comment.accountId} size="sm" />
                    <div className={styles.answerActions}>
                      <span className={styles.answerDate}>
                        {new Date(comment.date).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTipModal(comment.accountId)}
                      >
                        <Heart size={16} />
                      </Button>
                    </div>
                  </div>
                  <p className={styles.answerText}>{comment.text}</p>

                  {/* Accept Answer Button */}
                  <div className={styles.acceptSection}>
                    <AcceptAnswerButton
                      answerId={answerId}
                      answerAuthorId={comment.accountId}
                      isAccepted={isAccepted}
                      currentUserId={userAccountId}
                      onAccept={handleAcceptAnswer}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}{" "}
        <Card className={styles.addAnswerCard}>
          <h3 className={styles.addAnswerTitle}>Your Answer</h3>
          <form onSubmit={handleAddComment} className={styles.addAnswerForm}>
            <Textarea
              placeholder="Share your knowledge and help solve this problem..."
              rows={6}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <div className={styles.formActions}>
              <Button type="submit" disabled={isSubmitting || !userAccountId}>
                <Send size={20} />
                {isSubmitting ? "Posting..." : "Post Answer"}
              </Button>
              {!userAccountId && (
                <p className={styles.connectPrompt}>
                  Connect your wallet to post an answer
                </p>
              )}
            </div>
          </form>
        </Card>
      </div>

      {showTipModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowTipModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Send Tip</h3>
            <p className={styles.modalSubtitle}>
              Tip {tipTarget?.slice(0, 15)}... with DVT tokens
            </p>
            <div className={styles.quickTips}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTipAmount("1")}
              >
                1 DVT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTipAmount("5")}
              >
                5 DVT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTipAmount("10")}
              >
                10 DVT
              </Button>
            </div>
            <Input
              type="number"
              placeholder="Enter custom amount"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              min="1"
            />
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowTipModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleTip}>Send Tip</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionDetails;

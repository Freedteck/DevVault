import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Calendar,
  MessageCircle,
  Heart,
  Send,
} from "lucide-react";
import { userWalletContext } from "../../context/userWalletContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import topicMessageFnc from "../../client/topicMessage";
import tokenTransferFcn from "../../client/tokenTransfer";
import styles from "../questionDetails/QuestionDetails.module.css";

const UpdateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { accountId: userAccountId, walletData } =
    useContext(userWalletContext);

  const [update, setUpdate] = useState(location.state?.update || null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipTarget, setTipTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commentsTopicId = import.meta.env.VITE_COMMENTS_TOPIC_ID;
  const tokenId = import.meta.env.VITE_TOKEN_ID;
  const topicId = import.meta.env.VITE_TOPIC_ID;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch update if not passed via state
        if (!update) {
          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
          );
          const data = await response.json();

          const messages = data.messages
            .map((message) => {
              try {
                const decodedMessage = atob(message.message);
                return JSON.parse(decodedMessage);
              } catch {
                return null;
              }
            })
            .filter((msg) => msg && msg.type === "update");

          const foundUpdate = messages.find(
            (_, index) => index + 1 === parseInt(id)
          );
          setUpdate(foundUpdate);
        }

        // Fetch comments
        const commentsResponse = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${commentsTopicId}/messages`
        );
        const commentsData = await commentsResponse.json();

        const allComments = commentsData.messages
          .map((message) => {
            try {
              const decodedMessage = atob(message.message);
              return JSON.parse(decodedMessage);
            } catch {
              return null;
            }
          })
          .filter((msg) => msg && msg.commentsId === id)
          .reverse();

        setComments(allComments);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, update, commentsTopicId, topicId]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || !userAccountId) {
      alert("Please connect your wallet and enter a comment");
      return;
    }

    setIsSubmitting(true);

    try {
      const metaData = {
        commentsId: id,
        text: newComment,
        icon: "https://cryptologos.cc/logos/hedera-hbar-logo.png",
        date: new Date().toISOString(),
        accountId: userAccountId,
      };

      await topicMessageFnc(
        walletData,
        userAccountId,
        commentsTopicId,
        metaData
      );

      setComments((prev) => [metaData, ...prev]);
      setNewComment("");
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

  if (isLoading) {
    return (
      <div className={styles.questionDetails}>
        <div className={styles.loading}>Loading update...</div>
      </div>
    );
  }

  if (!update) {
    return (
      <div className={styles.questionDetails}>
        <div className={styles.notFound}>
          <h2>Update not found</h2>
          <Button onClick={() => navigate("/discussions/updates")}>
            Back to Updates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.questionDetails}>
      <Button
        variant="ghost"
        onClick={() => navigate("/discussions/updates")}
        className={styles.backButton}
        icon={<ArrowLeft size={20} />}
        iconPosition="left"
      >
        Back to Updates
      </Button>

      <Card className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <h1 className={styles.title}>{update.title}</h1>
        </div>

        <p className={styles.description}>{update.description}</p>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <User size={16} />
            <span>{update.accountId}</span>
          </div>
          <div className={styles.metaItem}>
            <Calendar size={16} />
            <span>{new Date(update.date).toLocaleDateString()}</span>
          </div>
          <div className={styles.metaItem}>
            <MessageCircle size={16} />
            <span>{comments.length} comments</span>
          </div>
        </div>

        <div className={styles.tipSection}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTipModal(update.accountId)}
          >
            <Heart size={16} />
            Tip Author
          </Button>
        </div>
      </Card>

      <div className={styles.answersSection}>
        <h2 className={styles.answersTitle}>
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h2>

        {comments.length > 0 && (
          <div className={styles.answersList}>
            {comments.map((comment, index) => (
              <Card key={index} className={styles.answerCard}>
                <div className={styles.answerHeader}>
                  <div className={styles.answerMeta}>
                    <User size={16} />
                    <span>{comment.accountId}</span>
                  </div>
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
              </Card>
            ))}
          </div>
        )}

        <Card className={styles.addAnswerCard}>
          <h3 className={styles.addAnswerTitle}>Add a Comment</h3>
          <form onSubmit={handleAddComment} className={styles.addAnswerForm}>
            <Textarea
              placeholder="Share your thoughts..."
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <div className={styles.formActions}>
              <Button type="submit" disabled={isSubmitting || !userAccountId}>
                <Send size={20} />
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
              {!userAccountId && (
                <p className={styles.connectPrompt}>
                  Connect your wallet to post a comment
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

export default UpdateDetails;

import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, MessageCircle, Heart, Send } from "lucide-react";
import toast from "react-hot-toast";
import { userWalletContext } from "../../context/userWalletContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import UserWithBadge from "../../components/ui/UserWithBadge";
import topicMessageFnc from "../../client/topicMessage";
import tokenTransferFcn from "../../client/tokenTransfer";
import { useUpdateComments } from "../../hooks/useHCSData";
import styles from "../questionDetails/QuestionDetails.module.css";

const UpdateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { accountId: userAccountId, walletData } =
    useContext(userWalletContext);

  const [update, setUpdate] = useState(location.state?.update || null);
  const { data: comments, refetch: refetchComments } = useUpdateComments(id);
  const [newComment, setNewComment] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipTarget, setTipTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenId = import.meta.env.VITE_TOKEN_ID;
  const topicId = import.meta.env.VITE_UPDATES_TOPIC_ID;
  const commentsTopicId = import.meta.env.VITE_COMMENTS_TOPIC_ID;

  useEffect(() => {
    const fetchUpdate = async () => {
      // Fetch update if not passed via state
      if (!update) {
        try {
          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages/${id}`
          );
          const data = await response.json();

          try {
            const decodedMessage = atob(data.message);
            const parsedUpdate = JSON.parse(decodedMessage);
            setUpdate({
              ...parsedUpdate,
              sequence_number: data.sequence_number,
              consensus_timestamp: data.consensus_timestamp,
            });
          } catch (error) {
            console.error("Failed to parse update:", error);
          }
        } catch (error) {
          console.error("Failed to fetch update:", error);
        }
      }
      setIsLoading(false);
    };

    fetchUpdate();
  }, [id, update, topicId]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || !userAccountId) {
      toast.error("Please connect your wallet and enter a comment");
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
        commentsTopicId,
        metaData
      );

      setNewComment("");

      // Refetch comments to get fresh data from HCS
      await refetchComments();
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Failed to submit comment:", error);
      toast.error("Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTip = async () => {
    if (!tipAmount || !userAccountId || !tipTarget) {
      toast.error("Please enter a tip amount");
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
        toast.success(`Successfully tipped ${tipAmount} DVT tokens!`);
        setShowTipModal(false);
        setTipAmount("");
        setTipTarget(null);
      }
    } catch (error) {
      console.error("Failed to send tip:", error);
      toast.error("Failed to send tip. Please try again.");
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
          {update.tags && update.tags.length > 0 && (
            <div className={styles.tags}>
              {update.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <p className={styles.description}>{update.description}</p>

        <div className={styles.meta}>
          <UserWithBadge accountId={update.accountId} size="sm" />
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
            {comments.map((comment) => (
              <Card key={comment.sequence_number} className={styles.answerCard}>
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

import { useEffect, useState, useContext } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import styles from "./EnhancedQuestionDetails.module.css";
import Button from "../button/Button";
import AIAssistant from "../ai/AIAssistant";
import topicMessageFnc from "../../client/topicMessage";
import { userWalletContext } from "../../context/userWalletContext";
import TipModal from "../modal/TipModal";
import analyticsService from "../../services/analyticsService";
import toast from "react-hot-toast";

const EnhancedQuestionDetails = () => {
  const { accountId: userAccountId, walletData } = useContext(userWalletContext);
  const answersTopicId = import.meta.env.VITE_ANSWERS_TOPIC_ID;
  const tokenId = import.meta.env.VITE_TOKEN_ID;
  const { state } = useLocation();
  const { question } = state;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  const { title, description, accountId, date, icon } = question;
  const { id } = useParams();

  useEffect(() => {
    // Track page view
    if (userAccountId && walletData) {
      analyticsService.trackEvent('question_viewed', {
        questionId: id,
        questionTitle: title.substring(0, 50)
      }, walletData, userAccountId);
    }

    // Increment view count
    setViewCount(prev => prev + 1);
    
    fetchComments();
  }, [id, title, userAccountId, walletData]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/topics/${answersTopicId}/messages`
      );
      const data = await response.json();

      const messages = data.messages.map((message) => {
        const decodedMessage = atob(message.message);
        return JSON.parse(decodedMessage);
      });

      const questionComments = messages
        .map((message, index) => ({ ...message, id: index + 1 }))
        .filter((message) => message.commentsId === id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setComments(questionComments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() === "") return;

    if (userAccountId) {
      const metaData = {
        commentsId: id,
        text: newComment,
        icon: "https://cryptologos.cc/logos/hedera-hbar-logo.png",
        date: new Date().toISOString(),
        accountId: userAccountId,
      };

      try {
        await topicMessageFnc(walletData, userAccountId, answersTopicId, metaData);
        
        // Track comment
        await analyticsService.trackEvent('comment_added', {
          questionId: id,
          commentLength: newComment.length
        }, walletData, userAccountId);

        setComments((prev) => [{ ...metaData, id: prev.length + 1 }, ...prev]);
        setNewComment("");
        toast.success("Comment added successfully!");
      } catch (error) {
        console.error("Failed to submit comment:", error);
        toast.error("Failed to submit comment. Please try again.");
      }
    } else {
      toast.error("Please connect to HashPack wallet");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    const bookmarks = JSON.parse(localStorage.getItem('devvault_bookmarks') || '[]');
    
    if (!isBookmarked) {
      bookmarks.push({ id, title, date: new Date().toISOString() });
      toast.success("Question bookmarked!");
    } else {
      const filtered = bookmarks.filter(b => b.id !== id);
      localStorage.setItem('devvault_bookmarks', JSON.stringify(filtered));
      toast.success("Bookmark removed!");
    }
    
    localStorage.setItem('devvault_bookmarks', JSON.stringify(bookmarks));
  };

  const handleShowTipModal = (userId) => {
    setShowTipModal(true);
    setUserId(userId);
  };

  return (
    <div className={styles.questionDetails}>
      <div className={styles.header}>
        <div className={styles.questionHeader}>
          <h1>{title}</h1>
          <div className={styles.questionMeta}>
            <div className={styles.author}>
              <img src={icon} alt="author" className={styles.authorImage} />
              <div>
                <span className={styles.authorName}>{accountId}</span>
                <span className={styles.date}>
                  {new Date(date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className={styles.stats}>
              <span>{viewCount} views</span>
              <span>{comments.length} answers</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleShare}>
            <Share2 size={20} />
            Share
          </button>
          <button 
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmark}
          >
            <Bookmark size={20} />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <Button 
            text="Tip Author" 
            handleClick={() => handleShowTipModal(accountId)}
            btnClass="primary"
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.questionContent}>
          <p>{description}</p>
        </div>

        <AIAssistant 
          question={title} 
          context={comments.slice(0, 3).map(c => ({ title: c.text, description: c.text }))} 
        />

        <div className={styles.answers}>
          <div className={styles.answersHeader}>
            <h2>
              <MessageCircle size={24} />
              {comments.length} Answers
            </h2>
          </div>

          <div className={styles.addAnswer}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your knowledge and help the community..."
              className={styles.answerInput}
            />
            <div className={styles.answerActions}>
              <Button text="Post Answer" handleClick={handleAddComment} />
            </div>
          </div>

          <div className={styles.answersList}>
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <div key={index} className={styles.answer}>
                  <div className={styles.answerHeader}>
                    <div className={styles.answerAuthor}>
                      <img 
                        src={comment.icon || icon} 
                        alt="author" 
                        className={styles.authorImage}
                      />
                      <div>
                        <span className={styles.authorName}>{comment.accountId}</span>
                        <span className={styles.answerDate}>
                          {new Date(comment.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      className={styles.tipBtn}
                      onClick={() => handleShowTipModal(comment.accountId)}
                    >
                      <Heart size={16} />
                      Tip
                    </button>
                  </div>
                  <div className={styles.answerContent}>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noAnswers}>
                <MessageCircle size={48} />
                <h3>No answers yet</h3>
                <p>Be the first to help solve this question!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTipModal && (
        <TipModal
          accountId={userAccountId}
          tokenId={tokenId}
          walletData={walletData}
          userId={userId}
          handleClose={() => setShowTipModal(false)}
        />
      )}
    </div>
  );
};

export default EnhancedQuestionDetails;
import { useContext, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import styles from "./UpdateDetails.module.css";
import Button from "../../components/button/Button";
import { userWalletContext } from "../../context/userWalletContext";
import topicMessageFnc from "../../client/topicMessage";

const UpdateDetails = () => {
  const commentsTopicId = import.meta.env.VITE_COMMENTS_TOPIC_ID;
  const { accountId: userAccountId, walletData } =
    useContext(userWalletContext);
  const { state } = useLocation();
  const { update } = state;
  const { id } = useParams();

  const [tipAmount, setTipAmount] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const { title, description, accountId, date } = update;

  const handleTip = () => {
    alert(`You tipped ${tipAmount} tokens to ${accountId}!`);
    setTipAmount(0);
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
        await topicMessageFnc(
          walletData,
          userAccountId,
          commentsTopicId,
          metaData
        );

        // Optimistic update
        setComments((prev) => [{ ...metaData, id: prev.length + 1 }, ...prev]);

        setNewComment(""); // Clear input field
      } catch (error) {
        console.error("Failed to submit comment:", error);
        alert("Failed to submit the comment. Please try again.");
      }
    } else {
      alert("Please connect to HashPack wallet");
    }
  };

  useEffect(() => {
    if (!shouldRefetch) return;

    const fetchComments = async () => {
      try {
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${commentsTopicId}/messages`
        );
        const data = await response.json();

        const messages = data.messages.map((message) => {
          const decodedMessage = atob(message.message);
          return JSON.parse(decodedMessage);
        });

        const messagesWithId = messages
          .map((message, index) => ({
            ...message,
            id: index + 1,
          }))
          .filter((message) => message.commentsId === id)
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date

        setComments(messagesWithId);
        setShouldRefetch(false);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    };

    fetchComments();
  }, [shouldRefetch, commentsTopicId, id]);

  return (
    <div className={styles.updateDetails}>
      <header className={styles.header}>
        <div className={styles.details}>
          <h1>{title}</h1>
          <div className={styles.author}>
            <div className={styles.img}>
              <img
                src="https://cryptologos.cc/logos/hedera-hbar-logo.png"
                alt="icon"
              />
            </div>
            <p className={styles.meta}>
              By: {accountId} | {new Date(date).toLocaleDateString()}
            </p>
          </div>
          <p>{description}</p>
        </div>
      </header>

      <section className={styles.tipping}>
        <h2>Send A Tip</h2>
        <p>Tip {accountId} for this update</p>
        <div className={styles.tipButtons}>
          <Button text="1 DVT" handleClick={() => setTipAmount(1)} />
          <Button text="5 DVT" handleClick={() => setTipAmount(5)} />
          <Button text="10 DVT" handleClick={() => setTipAmount(10)} />
        </div>
        <label>
          <input
            type="number"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            placeholder="Enter tip amount"
          />
          <Button text="Tip" handleClick={handleTip} />
        </label>
      </section>

      <section className={styles.comments}>
        <h2>Comments</h2>
        <ul>
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <li key={index} className={styles.comment}>
                <div className={styles.author}>
                  <div className={styles.img}>
                    <img
                      src={
                        comment.icon ||
                        "https://cryptologos.cc/logos/hedera-hbar-logo.png"
                      }
                      alt="icon"
                    />
                  </div>
                  <h4>{comment.accountId}</h4>
                </div>
                <div className={styles.commentDetails}>
                  <p>{comment.text}</p>
                  <small>{new Date(comment.date).toLocaleDateString()}</small>
                </div>
              </li>
            ))
          ) : (
            <p>No comments yet. Be the first to comment!</p>
          )}
        </ul>
        <div className={styles.addComment}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
          />
          <Button text="Submit Comment" handleClick={handleAddComment} />
        </div>
      </section>
    </div>
  );
};

export default UpdateDetails;

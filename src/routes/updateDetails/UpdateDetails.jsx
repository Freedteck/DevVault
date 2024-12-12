import { useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./UpdateDetails.module.css";
import Button from "../../components/button/Button";

const UpdateDetails = () => {
  const { state } = useLocation();
  const { update } = state;
  const { title, description, accountId, date } = update;

  const [tipAmount, setTipAmount] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const handleTip = () => {
    alert(`You tipped ${tipAmount} tokens to ${accountId}!`);
    setTipAmount(0);
  };

  const handleAddComment = () => {
    if (newComment.trim() === "") return;
    setComments((prev) => [
      ...prev,
      { id: Date.now(), text: newComment, date: new Date().toISOString() },
    ]);
    setNewComment("");
  };

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
            comments.map((comment) => (
              <li key={comment.id} className={styles.comment}>
                <div className={styles.author}>
                  <div className={styles.img}>
                    <img
                      src={"https://cryptologos.cc/logos/hedera-hbar-logo.png"}
                      alt="icon"
                    />
                  </div>
                  <h4>{accountId}</h4>
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

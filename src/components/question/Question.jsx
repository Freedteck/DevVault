import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import styles from "./Question.module.css";

const Question = ({ question }) => {
  const { id, title, description, accountId, date, icon } = question;
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/question/${id}`, { state: { question } });
  };

  return (
    <div className={styles["questionItem"]} onClick={handleClick}>
      <div className={styles.img}>
        <img src={icon} alt="icon" />
      </div>
      <div className={styles.details}>
        <h3>{title.length > 34 ? `${title.slice(0, 34)}...` : title}</h3>
        <p>
          {description.length > 100
            ? `${description.slice(0, 100)}...`
            : description}
        </p>
        <div className={styles.meta}>
          <p>By: {accountId}</p>
          <p>{new Date(date).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

Question.propTypes = {
  question: PropTypes.object,
};

export default Question;

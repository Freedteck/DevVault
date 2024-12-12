import PropTypes from "prop-types";
import Question from "./Question";
import styles from "./QuestionList.module.css";

const QuestionList = ({ questions }) => (
  <div className={styles.questionList}>
    {questions.length === 0 && <p>No questions available</p>}
    {questions.map((question, index) => (
      <Question key={index} question={question} />
    ))}
  </div>
);

QuestionList.propTypes = {
  questions: PropTypes.array,
};

export default QuestionList;

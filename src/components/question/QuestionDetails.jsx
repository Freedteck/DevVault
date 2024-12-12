import PropTypes from "prop-types";

const QuestionDetails = ({ question }) => {
  if (!question) {
    return <p>Select a question to view details</p>;
  }

  const { title, description, accountId, date } = question;

  return (
    <div className="question-details">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="meta">
        <span>By: {accountId}</span>
        <span>Posted on: {new Date(date).toLocaleString()}</span>
      </div>
    </div>
  );
};

QuestionDetails.propTypes = {
  question: PropTypes.object,
};

export default QuestionDetails;

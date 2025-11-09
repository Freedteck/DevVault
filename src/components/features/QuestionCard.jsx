import { MessageCircle, User, Calendar, ArrowRight } from "lucide-react";
import PropTypes from "prop-types";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import styles from "./QuestionCard.module.css";

const QuestionCard = ({ question, onClick }) => {
  const { title, description, accountId, date, tags = [] } = question;

  return (
    <Card className={styles.card} onClick={onClick}>
      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>
          {description.length > 150
            ? `${description.slice(0, 150)}...`
            : description}
        </p>
      </div>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <div className={styles.author}>
            <div className={styles.avatar}>
              <User size={16} />
            </div>
            <span className={styles.authorName}>
              {accountId?.slice(0, 15)}...
            </span>
          </div>
          <div className={styles.metaItem}>
            <Calendar size={14} />
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
          <div className={styles.metaItem}>
            <MessageCircle size={14} />
            <span>0</span>
          </div>
        </div>
        <div className={styles.readMore}>
          <span>View</span>
          <ArrowRight size={16} className={styles.arrow} />
        </div>
      </div>
    </Card>
  );
};

QuestionCard.propTypes = {
  question: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    accountId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onClick: PropTypes.func,
};

export default QuestionCard;

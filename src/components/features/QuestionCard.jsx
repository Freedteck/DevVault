import { MessageCircle, Calendar, ArrowRight } from "lucide-react";
import PropTypes from "prop-types";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import UserWithBadge from "../ui/UserWithBadge";
import styles from "./QuestionCard.module.css";

const QuestionCard = ({ question, onClick }) => {
  const { title, description, accountId, date, tags = [], bounty } = question;

  return (
    <Card className={styles.card} onClick={onClick}>
      <div className={styles.headerRow}>
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {bounty > 0 && (
          <Badge variant="success" size="sm" className={styles.bountyBadge}>
            {bounty} HBAR Bounty
          </Badge>
        )}
      </div>

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
          <UserWithBadge accountId={accountId} size="sm" />
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
    bounty: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func,
};

export default QuestionCard;

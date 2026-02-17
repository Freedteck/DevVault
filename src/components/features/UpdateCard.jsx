import { Calendar, ArrowRight, Sparkles } from "lucide-react";
import PropTypes from "prop-types";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import UserWithBadge from "../ui/UserWithBadge";
import styles from "./UpdateCard.module.css";

const UpdateCard = ({ update, onClick }) => {
  const { title, description, accountId, date, tags = [] } = update;

  return (
    <Card className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={14} />
          <span>Update</span>
        </div>
        <div className={styles.date}>
          <Calendar size={14} />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
      </div>

      <div className={styles.content}>
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>
          {description.length > 150
            ? `${description.slice(0, 150)}...`
            : description}
        </p>
      </div>

      <div className={styles.footer}>
        <UserWithBadge accountId={accountId} size="sm" />
        <div className={styles.readMore}>
          <span>Read More</span>
          <ArrowRight size={16} className={styles.arrow} />
        </div>
      </div>
    </Card>
  );
};

UpdateCard.propTypes = {
  update: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    accountId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onClick: PropTypes.func,
};

export default UpdateCard;

import PropTypes from "prop-types";
import styles from "./Card.module.css";
import { CalendarDays, UserCircleIcon } from "lucide-react";

const Card = ({ data, type = "primary", showActions = false }) => {
  const { icon, title, description, accountId, date } = data;

  const renderIcon = () => (
    <div className={showActions ? styles.img : styles.icon}>
      {showActions ? (
        <img
          src={icon || "https://cryptologos.cc/logos/hedera-hbar-logo.png"}
          alt="icon"
        />
      ) : (
        <div>{icon}</div>
      )}
    </div>
  );

  const renderActions = () =>
    showActions && (
      <div className={styles.actions}>
        <div className={styles.actionItem}>
          <UserCircleIcon size={24} />
          <span>{accountId}</span>
        </div>
        <div className={styles.actionItem}>
          <CalendarDays size={24} />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
      </div>
    );

  return (
    <li className={styles[type]}>
      {renderIcon()}
      <h3>{title?.length > 34 ? `${title.slice(0, 34)}...` : title}</h3>
      <p>
        {description?.length > 100
          ? `${description.slice(0, 100)}...`
          : description}
      </p>
      {renderActions()}
    </li>
  );
};

Card.propTypes = {
  data: PropTypes.shape({
    icon: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    accountId: PropTypes.string,
    date: PropTypes.string,
  }).isRequired,
  type: PropTypes.string,
  showActions: PropTypes.bool,
};

export default Card;

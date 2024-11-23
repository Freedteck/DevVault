import PropTypes from "prop-types";
import styles from "./Card.module.css";
import { CalendarDays, LucideMessageCircleMore } from "lucide-react";

const Card = ({ data, type = "primary", showActions = false }) => {
  return (
    <li className={styles[type]}>
      <div className={styles.icon}>{data.icon}</div>
      <h3 className={styles.title}>{data.title}</h3>
      <p className={styles.description}>{data.description}</p>
      {showActions && (
        <div className={styles.actions}>
          <div>
            <LucideMessageCircleMore size={24} absoluteStrokeWidth />
            <span>30</span>
          </div>
          <div>
            <CalendarDays size={24} absoluteStrokeWidth />
            <span>23rd Nov. 2024</span>
          </div>
        </div>
      )}
    </li>
  );
};

Card.propTypes = {
  data: PropTypes.object.isRequired,
  type: PropTypes.string,
  showActions: PropTypes.bool,
};

export default Card;

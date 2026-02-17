import PropTypes from "prop-types";
import styles from "./Badge.module.css";

const Badge = ({
  children,
  variant = "default",
  size = "md",
  icon,
  className = "",
}) => {
  const classNames = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "default",
    "primary",
    "success",
    "warning",
    "error",
    "info",
  ]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default Badge;

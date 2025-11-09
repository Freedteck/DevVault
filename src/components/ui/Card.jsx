import PropTypes from "prop-types";
import styles from "./Card.module.css";

const Card = ({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  onClick,
  className = "",
  ...props
}) => {
  const classNames = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    hover && styles.hover,
    onClick && styles.clickable,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const Component = onClick ? "button" : "div";

  return (
    <Component className={classNames} onClick={onClick} {...props}>
      {children}
    </Component>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "bordered", "elevated"]),
  padding: PropTypes.oneOf(["none", "sm", "md", "lg"]),
  hover: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Card;

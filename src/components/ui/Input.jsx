import PropTypes from "prop-types";
import styles from "./Input.module.css";

const Input = ({
  label,
  error,
  helper,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const inputClasses = [
    styles.input,
    error && styles.error,
    icon && styles[`icon-${iconPosition}`],
    fullWidth && styles.fullWidth,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`${styles.wrapper} ${
        fullWidth ? styles.fullWidth : ""
      } ${className}`}
    >
      {label && (
        <label className={styles.label} htmlFor={props.id}>
          {label}
          {props.required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputContainer}>
        {icon && iconPosition === "left" && (
          <span className={styles.iconLeft}>{icon}</span>
        )}

        <input className={inputClasses} {...props} />

        {icon && iconPosition === "right" && (
          <span className={styles.iconRight}>{icon}</span>
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {helper && !error && <p className={styles.helper}>{helper}</p>}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(["left", "right"]),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
};

export default Input;

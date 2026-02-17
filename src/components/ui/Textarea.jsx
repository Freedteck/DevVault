import PropTypes from "prop-types";
import styles from "./Textarea.module.css";

const Textarea = ({
  label,
  error,
  helper,
  rows = 4,
  fullWidth = false,
  className = "",
  ...props
}) => {
  const textareaClasses = [
    styles.textarea,
    error && styles.error,
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

      <textarea className={textareaClasses} rows={rows} {...props} />

      {error && <p className={styles.errorText}>{error}</p>}
      {helper && !error && <p className={styles.helper}>{helper}</p>}
    </div>
  );
};

Textarea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  rows: PropTypes.number,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
};

export default Textarea;

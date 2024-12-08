import PropTypes from "prop-types";
import styles from "./Button.module.css";

const Button = ({ text, btnClass = "primary", handleClick }) => {
  return (
    <button className={styles[btnClass]} onClick={handleClick}>
      {text}
    </button>
  );
};

Button.propTypes = {
  text: PropTypes.string.isRequired,
  btnClass: PropTypes.string,
  handleClick: PropTypes.func,
};

export default Button;

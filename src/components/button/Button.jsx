import PropTypes from "prop-types";
import styles from "./Button.module.css";

const Button = ({ text, btnClass = "primary" }) => {
  return <button className={styles[btnClass]}>{text}</button>;
};

Button.propTypes = {
  text: PropTypes.string.isRequired,
  btnClass: PropTypes.string,
};

export default Button;

import Button from "../button/Button";
import styles from "./Banner.module.css";
import { useNavigate } from "react-router-dom";

const Banner = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/discussions');
  };

  const handleLearnMore = () => {
    navigate('/gtm');
  };

  return (
    <section className={styles.banner}>
      <div className={styles.heroTexts}>
        <h1>
          Empowering <span>Developers</span> <br />
          One Tip at a Time
        </h1>
        <p>
          Join the community of developers who are passionate about learning,{" "}
          <br />
          sharing knowledge, and building their careers.
        </p>
        <div className={styles.heroBtns}>
          <Button text="Get Started" handleClick={handleGetStarted} />
          <Button text="Learn More" btnClass="secondary" handleClick={handleLearnMore} />
        </div>
      </div>
    </section>
  );
};

export default Banner;

import Button from "../button/Button";
import styles from "./Banner.module.css";

const Banner = () => {
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
          <Button text="Get Started" />
          <Button text="Learn More" btnClass="secondary" />
        </div>
      </div>

      {/* <div className={styles.heroImg}>
        <img src="" alt="Hero" />
      </div> */}
    </section>
  );
};

export default Banner;

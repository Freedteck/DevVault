import { UserCheck } from "lucide-react";
import styles from "./Trending.module.css";
import Card from "../card/Card";
const Trending = () => {
  const trending = [
    {
      title: "How do I optimize React components for performance?",
      description:
        "Explore best practices to improve rendering and reduce unnecessary re-renders.",
      icon: <UserCheck size={48} absoluteStrokeWidth />, // Replace this with a relevant icon
    },
    {
      title: "What's the difference between '==' and '===' in JavaScript?",
      description:
        "A concise explanation of the nuances between equality and strict equality operators.",
      icon: <UserCheck size={48} absoluteStrokeWidth />,
    },
    {
      title: "How do I set up authentication in a MERN stack application?",
      description:
        "A beginner-friendly guide to implementing JWT authentication in a MERN app.",
      icon: <UserCheck size={48} absoluteStrokeWidth />,
    },
  ];

  return (
    <section className={styles.trending}>
      <h2>Trending</h2>
      <ul className={styles.row}>
        {trending.map((trend, index) => (
          <Card key={index} data={trend} type="secondary" showActions />
        ))}
      </ul>
    </section>
  );
};

export default Trending;

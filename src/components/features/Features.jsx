import {
  LucideSignalHigh,
  MessageCircleQuestion,
  MessageSquareText,
  User,
} from "lucide-react";
import styles from "./Features.module.css";
import Card from "../card/Card";

const Features = () => {
  const features = [
    {
      title: "Q&A",
      description: "Ask questions and get rewarded for helping others.",
      icon: <MessageCircleQuestion size={48} absoluteStrokeWidth />,
    },
    {
      title: "Regular Posts",
      description: "Share your thoughts and ideas with the community.",
      icon: <MessageSquareText size={48} absoluteStrokeWidth />,
    },
    {
      title: "Leaderboard",
      description: "Earn tokens and climb the ranks as a top contributor.",
      icon: <LucideSignalHigh size={48} absoluteStrokeWidth />,
    },
    {
      title: "Profile",
      description: "Track your contributions and tips earned on your profile.",
      icon: <User size={48} absoluteStrokeWidth />,
    },
  ];

  return (
    <section className={styles.features}>
      <h2>Features</h2>
      <ul className={styles.row}>
        {features.map((feature, index) => (
          <Card key={index} data={feature} />
        ))}
      </ul>
    </section>
  );
};

export default Features;

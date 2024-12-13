import styles from "./Trending.module.css";
import Card from "../card/Card";
import { useEffect, useState } from "react";
const Trending = () => {
  const topicId = import.meta.env.VITE_TOPIC_ID;
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    const fetchAllDiscussions = async () => {
      await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
      )
        .then((response) => response.json())
        .then((data) => {
          const messages = data.messages.map((message) => {
            const decodedMessage = atob(message.message); // decode base64
            return JSON.parse(decodedMessage); // parse JSON
          });
          const messagesWithId = messages.map((message, index) => {
            return { ...message, id: index + 1 };
          });
          setTrending(messagesWithId.slice(-3));
        })
        .catch((error) => {
          console.log(error);
        });
    };

    fetchAllDiscussions();
  }, [topicId]);

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

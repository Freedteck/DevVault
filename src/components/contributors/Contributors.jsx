import { useEffect, useState } from "react";
import styles from "./Contributors.module.css";
import ContributorCard from "./ContributorCard";

const Contributors = () => {
  const topicId = import.meta.env.VITE_TOPIC_ID;
  const [contribution, setContribution] = useState([]);

  useEffect(() => {
    const fetchAllDiscussions = async () => {
      try {
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
        );
        const data = await response.json();

        const messages = data.messages.map((message) => {
          const decodedMessage = atob(message.message); // Decode base64
          return JSON.parse(decodedMessage); // Parse JSON
        });

        // Aggregate contributors
        const contributorsMap = new Map();

        messages.forEach((message) => {
          const { accountId } = message;
          if (accountId) {
            if (!contributorsMap.has(accountId)) {
              contributorsMap.set(accountId, { accountId, contributions: 0 });
            }
            contributorsMap.get(accountId).contributions += 1;
          }
        });

        const contributors = Array.from(contributorsMap.values());

        setContribution(contributors.slice(-3));
      } catch (error) {
        console.error("Error fetching discussions:", error);
      }
    };

    fetchAllDiscussions();
  }, [topicId]);

  return (
    <section className={styles.contributor}>
      <h2>Top Contributors</h2>
      <ul className={styles.row}>
        {contribution.map((contribute, index) => (
          <ContributorCard key={index} data={contribute} />
        ))}
      </ul>
    </section>
  );
};

export default Contributors;

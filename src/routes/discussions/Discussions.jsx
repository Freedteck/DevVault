import { NavLink, Outlet } from "react-router-dom";
import styles from "./Discussions.module.css";
import { useEffect, useState } from "react";

const Discussions = () => {
  const topicId = import.meta.env.VITE_TOPIC_ID;
  const [allDiscussions, setAllDiscussions] = useState([]);

  useEffect(() => {
    fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
    )
      .then((response) => response.json())
      .then((data) => {
        const messages = data.messages.map((message) => {
          const decodedMessage = atob(message.message); // decode base64
          return JSON.parse(decodedMessage); // parse JSON
        });
        setAllDiscussions(messages);
        console.log(messages);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [topicId]);

  return (
    <main className={styles.discussions}>
      <nav>
        <NavLink
          to="/discussions"
          end
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          Ask & Build
        </NavLink>
        <NavLink
          to="updates"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          Updates
        </NavLink>
      </nav>
      <Outlet context={allDiscussions} />
    </main>
  );
};

export default Discussions;

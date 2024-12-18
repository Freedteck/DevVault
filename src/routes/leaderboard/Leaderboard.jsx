import { useEffect, useState } from "react";
import style from "./Leaderboard.module.css";

const tokenId = import.meta.env.VITE_TOKEN_ID;
const topicId = import.meta.env.VITE_TOPIC_ID;
const Leaderboard = () => {
  const [contributors, setContributors] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  const fetchTokenBalance = async (accountId) => {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens`
      );
      const data = await response.json();
      const token = data.tokens.find((token) => token.token_id === tokenId);
      return token ? token.balance : 0; // Return token balance or 0 if not found
    } catch (error) {
      console.error(`Error fetching token balance for ${accountId}:`, error);
      return 0;
    }
  };

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

        // Aggregate contributions
        const contributorsMap = new Map();

        for (const message of messages) {
          const { accountId } = message;
          if (accountId) {
            if (!contributorsMap.has(accountId)) {
              contributorsMap.set(accountId, {
                accountId,
                contributions: 0,
                tokens: 0,
              });
            }
            contributorsMap.get(accountId).contributions += 1;
          }
        }

        // Fetch token balances for contributors
        const contributorsArray = Array.from(contributorsMap.values());
        for (const contributor of contributorsArray) {
          const balance = await fetchTokenBalance(contributor.accountId);
          contributor.tokens = balance;
        }

        contributorsArray.sort((a, b) => b.tokens - a.tokens);

        const rankedContributors = contributorsArray.map(
          (contributor, index) => ({
            ...contributor,
            rank: index + 1,
          })
        );

        setContributors(rankedContributors);
        setTopContributors(rankedContributors.slice(0, 3));
      } catch (error) {
        console.error("Error fetching discussions:", error);
      }
    };
    fetchAllDiscussions();
  }, []);

  return (
    <div className={style.dashboard}>
      <section className={style["top-panel"]}>
        <h2>Top Contributors</h2>
        <div className={style["top-contributors"]}>
          {topContributors.map((contributor) => (
            <div key={contributor.rank} className={style["top-card"]}>
              <div className={style.rank}>{contributor.rank}</div>
              <h3>{contributor.accountId}</h3>
              <p>
                {contributor.tokens} <span>DVT</span> Tokens
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={style["all-panel"]}>
        <h2>All Contributors</h2>
        <table className={style["contributors-table"]}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Account ID</th>
              <th>Contributions</th>
              <th>Tokens</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((contributor) => (
              <tr key={contributor.rank}>
                <td>{contributor.rank}</td>
                <td>{contributor.accountId}</td>
                <td>{contributor.contributions}</td>
                <td>{contributor.tokens}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Leaderboard;

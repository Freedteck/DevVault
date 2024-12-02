import React from 'react'
import './leaderboard.css'

const Leaderboard = () => {
    const contributors = [
      { rank: 1, name: "Alice", tokens: 150 },
      { rank: 2, name: "Bob", tokens: 120 },
      { rank: 3, name: "Charlie", tokens: 100 },
      { rank: 4, name: "Dave", tokens: 80 },
      { rank: 5, name: "Eve", tokens: 70 },
    ];

    const topContributors = contributors.slice(0, 3);
  return (
    <div className="leaderboard-container">
      <header className="leaderboard-header">
        <h1>Leaderboard</h1>
        <p>Recognizing our top contributors based on tokens received.</p>
      </header>

      <section className="top-contributors">
        {topContributors.map((contributor, index) => (
          <div key={contributor.rank} className="top-card">
            <div className="rank-badge">{index + 1}</div>
            <h2>{contributor.name}</h2>
            <p>{contributor.tokens} Tokens</p>
          </div>
        ))}
      </section>

      <section className="leaderboard-table">
        <h2>All Contributors</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Tokens</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((contributor) => (
              <tr key={contributor.rank}>
                <td>{contributor.rank}</td>
                <td>{contributor.name}</td>
                <td>{contributor.tokens}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default Leaderboard
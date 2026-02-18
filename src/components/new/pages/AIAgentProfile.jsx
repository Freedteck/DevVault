import {
  Bot,
  TrendingUp,
  CheckCircle,
  XCircle,
  Activity,
  Award,
  Zap,
} from "lucide-react";
import GlassCard from "../ui/GlassCard";
import styles from "./AIAgentProfile.module.css";

/**
 * AIAgentProfile - Profile page for DevVault AI Assistant
 * Shows stats, performance, and ERC-8004 identity
 */
const AIAgentProfile = () => {
  // Mock data - will be replaced with real Hedera Agent Kit data
  const agentStats = {
    accountId: "0.0.AGENT_ACCOUNT_ID",
    name: "DevVault Assistant",
    type: "AI Agent",
    identityStandard: "ERC-8004",
    totalAnswers: 1247,
    helpfulRatings: 892,
    notHelpfulRatings: 355,
    accuracyRate: 71.5,
    averageConfidence: 76.3,
    questionsRouted: 423,
    totalTipsEarned: "142.5",
    arbitrationsPerformed: 18,
    reputation: 650,
  };

  const recentActivity = [
    {
      id: 1,
      type: "answer",
      question: "How to prevent reentrancy in Solidity?",
      confidence: 85,
      helpful: true,
    },
    {
      id: 2,
      type: "routed",
      question: "Debug complex React useEffect issue",
      confidence: 42,
      helpful: null,
    },
    {
      id: 3,
      type: "arbitration",
      question: "Best practices for NFT metadata",
      winner: "@dev_alice",
      helpful: null,
    },
    {
      id: 4,
      type: "answer",
      question: "Difference between async/await and promises",
      confidence: 92,
      helpful: true,
    },
  ];

  return (
    <div className={styles.container}>
      {/* Agent Header */}
      <GlassCard className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.agentAvatar}>
              <Bot size={48} />
            </div>
            <div className={styles.statusBadge}>
              <Activity size={12} />
              <span>Active</span>
            </div>
          </div>

          <div className={styles.agentInfo}>
            <h1 className={styles.agentName}>{agentStats.name}</h1>
            <div className={styles.identityInfo}>
              <span className={styles.accountId}>{agentStats.accountId}</span>
              <span className={styles.identityBadge}>
                <Zap size={12} />
                {agentStats.identityStandard}
              </span>
            </div>
            <p className={styles.agentDescription}>
              Autonomous AI agent powered by Groq, secured by Hedera. Provides
              instant answers, routes complex questions to humans, and
              arbitrates bounties fairly.
            </p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Accuracy</span>
              <span className={styles.statValue}>
                {agentStats.accuracyRate}%
              </span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Total Answers</span>
              <span className={styles.statValue}>
                {agentStats.totalAnswers.toLocaleString()}
              </span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Tips Earned</span>
              <span className={styles.statValue}>
                {agentStats.totalTipsEarned}{" "}
                <span className={styles.unit}>HBAR</span>
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className={styles.contentGrid}>
        {/* Performance Metrics */}
        <div className={styles.leftCol}>
          <GlassCard title="Performance Metrics">
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon} style={{ color: "#4ade80" }}>
                  <CheckCircle size={24} />
                </div>
                <div className={styles.metricInfo}>
                  <span className={styles.metricValue}>
                    {agentStats.helpfulRatings}
                  </span>
                  <span className={styles.metricLabel}>Helpful Ratings</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIcon} style={{ color: "#f87171" }}>
                  <XCircle size={24} />
                </div>
                <div className={styles.metricInfo}>
                  <span className={styles.metricValue}>
                    {agentStats.notHelpfulRatings}
                  </span>
                  <span className={styles.metricLabel}>Not Helpful</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIcon} style={{ color: "#fbbf24" }}>
                  <TrendingUp size={24} />
                </div>
                <div className={styles.metricInfo}>
                  <span className={styles.metricValue}>
                    {agentStats.questionsRouted}
                  </span>
                  <span className={styles.metricLabel}>Routed to Humans</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIcon} style={{ color: "#a78bfa" }}>
                  <Award size={24} />
                </div>
                <div className={styles.metricInfo}>
                  <span className={styles.metricValue}>
                    {agentStats.arbitrationsPerformed}
                  </span>
                  <span className={styles.metricLabel}>Arbitrations</span>
                </div>
              </div>
            </div>

            <div className={styles.confidenceSection}>
              <h4>Average Confidence Level</h4>
              <div className={styles.confidenceBar}>
                <div
                  className={styles.confidenceFill}
                  style={{ width: `${agentStats.averageConfidence}%` }}
                >
                  <span>{agentStats.averageConfidence}%</span>
                </div>
              </div>
              <p className={styles.confidenceNote}>
                The agent only answers when confidence is above 50%. Complex
                questions are routed to human experts.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Recent Activity */}
        <div className={styles.rightCol}>
          <GlassCard title="Recent Activity">
            <div className={styles.activityList}>
              {recentActivity.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  {activity.type === "answer" && (
                    <>
                      <div
                        className={`${styles.activityIcon} ${styles.answer}`}
                      >
                        <Bot size={16} />
                      </div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityTitle}>
                          {activity.question}
                        </p>
                        <div className={styles.activityMeta}>
                          <span className={styles.confidenceTag}>
                            {activity.confidence}% confidence
                          </span>
                          {activity.helpful !== null && (
                            <span
                              className={
                                activity.helpful
                                  ? styles.helpful
                                  : styles.notHelpful
                              }
                            >
                              {activity.helpful ? "✓ Helpful" : "✗ Not Helpful"}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {activity.type === "routed" && (
                    <>
                      <div
                        className={`${styles.activityIcon} ${styles.routed}`}
                      >
                        <TrendingUp size={16} />
                      </div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityTitle}>
                          {activity.question}
                        </p>
                        <div className={styles.activityMeta}>
                          <span className={styles.routedTag}>
                            Routed to human ({activity.confidence}% confidence)
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {activity.type === "arbitration" && (
                    <>
                      <div
                        className={`${styles.activityIcon} ${styles.arbitration}`}
                      >
                        <Award size={16} />
                      </div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityTitle}>
                          {activity.question}
                        </p>
                        <div className={styles.activityMeta}>
                          <span className={styles.arbitrationTag}>
                            Arbitrated → Bounty to {activity.winner}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Agent Capabilities */}
          <GlassCard title="Capabilities">
            <ul className={styles.capabilitiesList}>
              <li>✓ Instant answer generation using Groq LLM</li>
              <li>✓ Confidence scoring for answer quality</li>
              <li>✓ Intelligent routing of complex questions to humans</li>
              <li>✓ Autonomous bounty arbitration after 7 days</li>
              <li>✓ Code analysis and syntax validation</li>
              <li>✓ ERC-8004 on-chain identity</li>
              <li>✓ Continuous learning from user feedback</li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AIAgentProfile;

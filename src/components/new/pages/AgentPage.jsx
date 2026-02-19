import { Bot, Zap, Shield, Radio, ExternalLink, RefreshCw, Loader, Activity, Link2 } from "lucide-react";
import PropTypes from "prop-types";
import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";
import { useAgentActivity } from "../../../hooks/useAgentActivity";
import styles from "./AgentPage.module.css";

// ── Constants ──────────────────────────────────────────────────────────────
const HASHSCAN = "https://hashscan.io/testnet";

const AGENT_ACCOUNT_ID     = import.meta.env.VITE_AGENT_ACCOUNT_ID;
const INBOUND_TOPIC_ID     = import.meta.env.VITE_AGENT_INBOUND_TOPIC_ID;
const OUTBOUND_TOPIC_ID    = import.meta.env.VITE_AGENT_OUTBOUND_TOPIC_ID;
const PROFILE_TOPIC_ID     = import.meta.env.VITE_AGENT_PROFILE_TOPIC_ID;
const OPERATOR_ID          = `${INBOUND_TOPIC_ID}@${AGENT_ACCOUNT_ID}`;

// ── Helpers ────────────────────────────────────────────────────────────────
function getAgentStatus(activities) {
  if (!activities.length) return { label: "Standby", color: "muted" };
  const latestMs = activities[0].ts.getTime();
  const diffH = (Date.now() - latestMs) / (1000 * 60 * 60);
  if (diffH < 1)  return { label: "Active",  color: "green" };
  if (diffH < 24) return { label: "Running", color: "cyan"  };
  return           { label: "Standby",  color: "muted" };
}

function getRelativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMs / 3600000);
  const d = Math.floor(diffMs / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

const HashscanLink = ({ path, label }) => (
  <a
    href={`${HASHSCAN}/${path}`}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.hashscanLink}
  >
    <span className={styles.monoId}>{label}</span>
    <ExternalLink size={12} />
  </a>
);
HashscanLink.propTypes = { path: PropTypes.string.isRequired, label: PropTypes.string.isRequired };

const ActivityIcon = ({ type }) => {
  if (type === "answer")     return <Zap size={14} className={styles.iconAnswer} />;
  if (type === "connection") return <Link2 size={14} className={styles.iconConnection} />;
  if (type === "hol_reply")  return <Radio size={14} className={styles.iconHol} />;
  return <Activity size={14} className={styles.iconOther} />;
};
ActivityIcon.propTypes = { type: PropTypes.string.isRequired };

const ActivityItem = ({ item }) => (
  <div className={styles.activityItem}>
    <div className={styles.activityIconWrap}>
      <ActivityIcon type={item.type} />
    </div>
    <div className={styles.activityBody}>
      <span className={styles.activityLabel}>{item.label}</span>
      {item.type === "answer" && item.meta?.questionId && (
        <span className={styles.activityMeta}>
          question: {item.meta.questionId}
        </span>
      )}
    </div>
    <span className={styles.activityTime}>{getRelativeTime(item.ts)}</span>
  </div>
);
ActivityItem.propTypes = { item: PropTypes.object.isRequired };

// ── Page ───────────────────────────────────────────────────────────────────

const AgentPage = () => {
  const { activities, isLoading, error, refresh } = useAgentActivity(25);
  const status = getAgentStatus(activities);

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Bot size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>DevVault AI Agent</h1>
            <p className={styles.subtitle}>
              Autonomous agent registered in the{" "}
              <a
                href="https://hol.org/registry"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.holLink}
              >
                HOL Agent Registry
              </a>{" "}
              via HCS-10 OpenConvAI
            </p>
          </div>
        </div>
        <div className={`${styles.statusBadge} ${styles[`status_${status.color}`]}`}>
          <span className={styles.statusDot} />
          {status.label}
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── Identity ── */}
        <GlassCard className={styles.identityCard}>
          <h2 className={styles.sectionTitle}>Identity</h2>
          <p className={styles.sectionHint}>
            How to locate and reach this agent on Hedera
          </p>

          <div className={styles.idRows}>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Account</span>
              <HashscanLink path={`account/${AGENT_ACCOUNT_ID}`} label={AGENT_ACCOUNT_ID} />
            </div>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Operator ID</span>
              <span className={`${styles.monoId} ${styles.operatorId}`} title="HCS-10 format: inboundTopicId@accountId">
                {OPERATOR_ID}
              </span>
            </div>
            <hr className={styles.divider} />
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Inbound Topic</span>
              <HashscanLink path={`topic/${INBOUND_TOPIC_ID}`} label={INBOUND_TOPIC_ID} />
            </div>
            <div className={styles.idRowHint}>
              Send HCS-10 <code>connection_request</code> here to connect
            </div>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Outbound Topic</span>
              <HashscanLink path={`topic/${OUTBOUND_TOPIC_ID}`} label={OUTBOUND_TOPIC_ID} />
            </div>
            <div className={styles.idRowHint}>
              Public activity log — all agent actions are recorded here
            </div>
            <div className={styles.idRow}>
              <span className={styles.idLabel}>Profile Topic</span>
              <HashscanLink path={`topic/${PROFILE_TOPIC_ID}`} label={PROFILE_TOPIC_ID} />
            </div>
            <div className={styles.idRowHint}>HCS-11 profile metadata</div>
          </div>
        </GlassCard>

        {/* ── Roles ── */}
        <div className={styles.rolesCol}>
          <h2 className={`${styles.sectionTitle} ${styles.rolesSectionTitle}`}>
            What the Agent Does
          </h2>

          <GlassCard className={styles.roleCard}>
            <div className={styles.roleHeader}>
              <span className={styles.roleIconWrap}>
                <Zap size={18} />
              </span>
              <div>
                <h3 className={styles.roleName}>Auto-Answerer</h3>
                <span className={styles.roleTrigger}>Triggered on question post · every 15 min</span>
              </div>
            </div>
            <p className={styles.roleDesc}>
              When a question is posted to DevVault, a GitHub Actions workflow triggers
              this agent. It reads the question from HCS, fetches the full content from
              IPFS, calls the Groq LLaMA-3.3-70B model, and posts an AI answer back to
              the HCS answers topic — but only when confidence is{" "}
              <strong>≥ 50%</strong>. Lower-confidence questions are left for humans.
            </p>
          </GlassCard>

          <GlassCard className={styles.roleCard}>
            <div className={styles.roleHeader}>
              <span className={`${styles.roleIconWrap} ${styles.roleIconArbitrate}`}>
                <Shield size={18} />
              </span>
              <div>
                <h3 className={styles.roleName}>Bounty Arbiter</h3>
                <span className={styles.roleTrigger}>Daily cron · 2 AM UTC</span>
              </div>
            </div>
            <p className={styles.roleDesc}>
              For questions with HBAR bounties that have no accepted answer after{" "}
              <strong>7 days</strong>, the arbiter fetches all answers, scores each
              one with AI, picks the highest-quality response, and calls{" "}
              <code>arbiterRelease()</code> on the escrow smart contract — distributing
              the bounty automatically with no human intervention required.
            </p>
          </GlassCard>

          <GlassCard className={styles.roleCard}>
            <div className={styles.roleHeader}>
              <span className={`${styles.roleIconWrap} ${styles.roleIconHol}`}>
                <Radio size={18} />
              </span>
              <div>
                <h3 className={styles.roleName}>HOL Peer Agent</h3>
                <span className={styles.roleTrigger}>Polls inbound topic every 5 min</span>
              </div>
            </div>
            <p className={styles.roleDesc}>
              Registered in the Hashgraph Online Agent Registry (HCS-10 OpenConvAI),
              this agent accepts <code>connection_request</code> messages from other
              agents and humans on its inbound HCS topic. On receiving a question via
              the HCS-10 message protocol, it generates an answer and delivers it
              directly back to the sender&apos;s return topic — enabling agent-to-agent
              knowledge exchange.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <GlassCard className={styles.activityCard}>
        <div className={styles.activityHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Outbound Activity Log</h2>
            <p className={styles.sectionHint}>
              Live feed from the agent&apos;s HCS-10 outbound topic ({OUTBOUND_TOPIC_ID})
            </p>
          </div>
          <NeonButton
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={refresh}
            disabled={isLoading}
          >
            Refresh
          </NeonButton>
        </div>

        {isLoading ? (
          <div className={styles.feedLoading}>
            <Loader size={24} className="spin" />
            <span>Reading outbound topic…</span>
          </div>
        ) : error ? (
          <div className={styles.feedError}>
            <p>Could not load activity: {error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className={styles.feedEmpty}>
            <Activity size={32} className={styles.feedEmptyIcon} />
            <p>No activity recorded yet on this topic.</p>
            <p className={styles.feedEmptyHint}>
              Activity appears here once the agent has processed questions or
              received HOL connection requests.
            </p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {activities.map((item, i) => (
              <ActivityItem key={`${item.seq}-${i}`} item={item} />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AgentPage;

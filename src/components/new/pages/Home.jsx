import { ArrowRight, Code, Zap, Trophy } from "lucide-react";
import NeonButton from "../ui/NeonButton";
import GlassCard from "../ui/GlassCard";
import QuestionCardNew from "../features/QuestionCardNew";
import { MOCK_QUESTIONS } from "../data/mock";
import styles from "./Home.module.css";

const HomeNew = () => {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {/* <div className={styles.badge}>
            <span className={styles.badgePulse} />
            HACKATHON LIVE
          </div> */}
          <h1 className={styles.heroTitle}>
            Decentralized <br />
            <span className={styles.textGradient}>Developer Intelligence</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Get instant solutions, earn crypto for your code, and level up your
            reputation. The first Web3 developer marketplace powered by Hedera.
          </p>

          <div className={styles.heroActions}>
            <NeonButton size="lg" icon={<Code size={20} />}>
              Start Solving
            </NeonButton>
            <NeonButton variant="ghost" size="lg" icon={<Zap size={20} />}>
              Get Live Help
            </NeonButton>
          </div>

          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>$125k+</span>
              <span className={styles.statLabel}>Bounties Paid</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>1,250</span>
              <span className={styles.statLabel}>Active Solvers</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>4.8s</span>
              <span className={styles.statLabel}>Avg. Finality</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🔥</span> Trending Questions
          </h2>
          <NeonButton variant="ghost" size="sm" icon={<ArrowRight size={16} />}>
            View All
          </NeonButton>
        </div>

        <div className={styles.grid}>
          {MOCK_QUESTIONS.map((q) => (
            <QuestionCardNew key={q.id} question={q} />
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.featureSection}>
        <div className={styles.grid3}>
          <GlassCard className={styles.featureCard} variant="featured">
            <div
              className={styles.featureIcon}
              style={{ color: "var(--apex-primary-400)" }}
            >
              <Code size={32} />
            </div>
            <h3>Code Bounties</h3>
            <p>
              Post your toughest bugs. Set a price. Get verified solutions from
              experts.
            </p>
          </GlassCard>

          <GlassCard className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ color: "var(--apex-cyan-400)" }}
            >
              <Zap size={32} />
            </div>
            <h3>Live Help</h3>
            <p>
              Real-time pair programming sessions streaming flow payments via
              x402.
            </p>
          </GlassCard>

          <GlassCard className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              style={{ color: "var(--apex-pink-500)" }}
            >
              <Trophy size={32} />
            </div>
            <h3>Reputation NFTs</h3>
            <p>
              Your contributions mint dynamic SBTs. Prove your skills on-chain.
            </p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default HomeNew;

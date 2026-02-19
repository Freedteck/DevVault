import { useState, useEffect } from "react";
import { ArrowRight, Code, Trophy } from "lucide-react";
import NeonButton from "../ui/NeonButton";
import GlassCard from "../ui/GlassCard";
import QuestionCardNew from "../features/QuestionCardNew";
import { useQuestions } from "../../../hooks/useQuestions";
import styles from "./Home.module.css";
import { Link } from "react-router-dom";

const HomeNew = () => {
  const { questions, isLoading } = useQuestions(3);
  const [stats, setStats] = useState({ questions: null, answers: null, acceptances: null });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const base = "https://testnet.mirrornode.hedera.com/api/v1/topics";
        const q = import.meta.env.VITE_NEW_QUESTION_TOPIC_ID;
        const a = import.meta.env.VITE_NEW_ANSWER_TOPIC_ID;
        const acc = import.meta.env.VITE_NEW_ACCEPTANCE_TOPIC_ID;

        // Fetch latest message from each topic — sequence_number equals total count
        const [qRes, aRes, accRes] = await Promise.all([
          fetch(`${base}/${q}/messages?limit=1&order=desc`),
          fetch(`${base}/${a}/messages?limit=1&order=desc`),
          fetch(`${base}/${acc}/messages?limit=1&order=desc`),
        ]);

        const [qData, aData, accData] = await Promise.all([
          qRes.json(),
          aRes.json(),
          accRes.json(),
        ]);

        setStats({
          questions: qData.messages?.[0]?.sequence_number ?? 0,
          answers: aData.messages?.[0]?.sequence_number ?? 0,
          acceptances: accData.messages?.[0]?.sequence_number ?? 0,
        });
      } catch {
        // silently fail — stats are non-critical
      }
    };
    fetchStats();
  }, []);

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
            <Link to="/questions" style={{ textDecoration: "none" }}>
              <NeonButton size="lg" icon={<Code size={20} />}>
                Start Solving
              </NeonButton>
            </Link>
            <Link to="/updates" style={{ textDecoration: "none" }}>
              <NeonButton variant="ghost" size="lg" icon={<ArrowRight size={20} />}>
                Developer News
              </NeonButton>
            </Link>
          </div>

          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {stats.questions !== null ? stats.questions : "—"}
              </span>
              <span className={styles.statLabel}>Questions Asked</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {stats.answers !== null ? stats.answers : "—"}
              </span>
              <span className={styles.statLabel}>Answers Given</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {stats.acceptances !== null ? stats.acceptances : "—"}
              </span>
              <span className={styles.statLabel}>Solutions Accepted</span>
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
          <Link to="/questions" style={{ textDecoration: "none" }}>
            <NeonButton
              variant="ghost"
              size="sm"
              icon={<ArrowRight size={16} />}
            >
              View All
            </NeonButton>
          </Link>
        </div>

        <div className={styles.grid}>
          {isLoading ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              <p style={{ color: "rgba(255,255,255,0.6)" }}>
                Loading questions...
              </p>
            </div>
          ) : questions.length > 0 ? (
            questions
              .slice(0, 3)
              .map((q) => <QuestionCardNew key={q.id} question={q} />)
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              <p style={{ color: "rgba(255,255,255,0.6)" }}>
                No questions yet. Be the first to ask!
              </p>
            </div>
          )}
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
              <ArrowRight size={32} />
            </div>
            <h3>AI Instant Answers</h3>
            <p>
              Questions get an instant AI response. Complex problems are routed
              to human experts with bounties.
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

import { ArrowRight, Code, Trophy } from "lucide-react";
import styles from "./home.module.css";
import Link from "next/link";
import NeonButton from "../components/ui/NeonButton";
import GlassCard from "../components/ui/GlassCard";
import { Suspense } from "react";
import HomeStats from "../components/features/HomeStats";
import TrendingQuestions from "../components/features/TrendingQuestions";
import StatsSkeleton from "../components/features/StatsSkeleton";
import QuestionSkeleton from "../components/features/QuestionSkeleton";

export default function Page() {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Decentralized <br />
            <span className={styles.textGradient}>Developer Intelligence</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Get instant solutions, earn crypto for your code, and level up your
            reputation. The first Web3 developer marketplace powered by Hedera.
          </p>

          <div className={styles.heroActions}>
            <Link href="/questions" style={{ textDecoration: "none" }}>
              <NeonButton size="lg" icon={<Code size={20} />}>
                Start Solving
              </NeonButton>
            </Link>
            <Link href="/updates" style={{ textDecoration: "none" }}>
              <NeonButton
                variant="ghost"
                size="lg"
                icon={<ArrowRight size={20} />}
              >
                Developer News
              </NeonButton>
            </Link>
          </div>

          {/* Granular Loading for Stats */}
          <Suspense fallback={<StatsSkeleton />}>
            <HomeStats />
          </Suspense>
        </div>
      </section>

      {/* Trending Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🔥</span> Trending Questions
          </h2>
          <Link href="/questions" style={{ textDecoration: "none" }}>
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
          {/* Granular Loading for Questions */}
          <Suspense
            fallback={
              <>
                <QuestionSkeleton />
                <QuestionSkeleton />
                <QuestionSkeleton />
              </>
            }
          >
            <TrendingQuestions />
          </Suspense>
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
}

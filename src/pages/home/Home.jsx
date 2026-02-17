import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageSquare,
  Trophy,
  Users,
  Sparkles,
  Zap,
  Shield,
  Code2,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EscrowDeployer from "../../components/features/EscrowDeployer";
import styles from "./Home.module.css";

const Home = () => {
  const features = [
    {
      icon: <MessageSquare size={24} />,
      title: "Ask & Answer",
      description:
        "Post questions, share solutions, and help fellow developers solve problems.",
    },
    {
      icon: <Sparkles size={24} />,
      title: "Share Updates",
      description:
        "Keep the community updated with the latest frameworks, tools, and best practices.",
    },
    {
      icon: <Trophy size={24} />,
      title: "Earn Rewards",
      description:
        "Get tipped in DVT tokens for valuable contributions and helpful answers.",
    },
    {
      icon: <Users size={24} />,
      title: "Leaderboard",
      description:
        "Climb the ranks and showcase your expertise as a top contributor.",
    },
  ];

  const stats = [
    { label: "Active Developers", value: "1,000+" },
    { label: "Questions Answered", value: "5,000+" },
    { label: "DVT Distributed", value: "50,000+" },
  ];

  const benefits = [
    {
      icon: <Zap size={32} />,
      title: "Instant Rewards",
      description:
        "Receive DVT tokens instantly for your valuable contributions via Hedera's fast consensus.",
    },
    {
      icon: <Shield size={32} />,
      title: "Secure & Transparent",
      description:
        "All transactions are recorded on Hedera's distributed ledger, ensuring transparency and security.",
    },
    {
      icon: <Code2 size={32} />,
      title: "Developer-First",
      description:
        "Built by developers, for developers. Share code, best practices, and technical insights.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Connect Your Wallet",
      description: "Link your HashPack wallet to get started on DevVault.",
    },
    {
      step: "2",
      title: "Share Knowledge",
      description: "Ask questions, answer queries, or post developer updates.",
    },
    {
      step: "3",
      title: "Earn & Tip",
      description:
        "Receive DVT tokens for helpful answers or tip others for their contributions.",
    },
    {
      step: "4",
      title: "Climb the Ranks",
      description:
        "Build your reputation and appear on the leaderboard as a top contributor.",
    },
  ];

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Sparkles size={16} />
            <span>Powered by Hedera</span>
          </div>

          <h1 className={styles.heroTitle}>
            Empowering Developers,
            <br />
            <span className={styles.gradient}>One Tip at a Time</span>
          </h1>

          <p className={styles.heroDescription}>
            Join a decentralized community where knowledge sharing is rewarded.
            Ask questions, share insights, and earn DVT tokens for your
            contributions.
          </p>

          <div className={styles.heroActions}>
            <Link to="/discussions">
              <Button size="lg">
                Get Started
                <ArrowRight size={20} />
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg">
                View Leaderboard
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.stat}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escrow Deployment Section - Only show if escrow not configured */}
      {!import.meta.env.VITE_ESCROW_CONTRACT_ID && (
        <section className={styles.escrow}>
          <div className={styles.container}>
            <EscrowDeployer />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why DevVault?</h2>
            <p className={styles.sectionDescription}>
              Everything you need to collaborate, learn, and earn in a single
              platform
            </p>
          </div>

          <div className={styles.featureGrid}>
            {features.map((feature, index) => (
              <Card key={index} variant="elevated" padding="lg" hover>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <Badge variant="primary">Simple Process</Badge>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionDescription}>
              Get started in minutes and begin earning rewards
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {howItWorks.map((item, index) => (
              <div key={index} className={styles.step}>
                <div className={styles.stepNumber}>{item.step}</div>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDescription}>{item.description}</p>
                {index < howItWorks.length - 1 && (
                  <ArrowRight className={styles.stepArrow} size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <div className={styles.container}>
          <div className={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <Card key={index} padding="lg" className={styles.benefitCard}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                <p className={styles.benefitDescription}>
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial/Trust Section */}
      <section className={styles.trust}>
        <div className={styles.container}>
          <div className={styles.trustContent}>
            <div className={styles.trustIcon}>
              <CheckCircle size={48} />
            </div>
            <h2 className={styles.trustTitle}>Powered by Hedera Hashgraph</h2>
            <p className={styles.trustDescription}>
              Built on enterprise-grade distributed ledger technology, ensuring
              fast, fair, and secure transactions for all community members.
            </p>
            <div className={styles.trustFeatures}>
              <div className={styles.trustFeature}>
                <TrendingUp size={20} />
                <span>10,000+ TPS</span>
              </div>
              <div className={styles.trustFeature}>
                <Zap size={20} />
                <span>3-5 sec finality</span>
              </div>
              <div className={styles.trustFeature}>
                <Shield size={20} />
                <span>Carbon Negative</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Join the Community?</h2>
          <p className={styles.ctaDescription}>
            Start contributing, earning rewards, and building your reputation
            today.
          </p>
          <Link to="/discussions">
            <Button size="lg">
              Start Contributing
              <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

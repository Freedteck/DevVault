import { useState } from 'react';
import { Target, Users, TrendingUp, DollarSign, Calendar, MapPin } from 'lucide-react';
import styles from './GTMStrategy.module.css';
import marketFeedbackService from '../../services/marketFeedbackService';

const GTMStrategy = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const marketInsights = marketFeedbackService.generateMarketInsights();

  const tabs = [
    { id: 'overview', label: 'Market Overview', icon: <Target /> },
    { id: 'personas', label: 'User Personas', icon: <Users /> },
    { id: 'competition', label: 'Competition', icon: <TrendingUp /> },
    { id: 'strategy', label: 'GTM Strategy', icon: <DollarSign /> }
  ];

  const gtmPhases = [
    {
      phase: "Phase 1: Foundation (Months 1-3)",
      objectives: [
        "Launch MVP with core Q&A and tipping features",
        "Onboard 1,000 early adopters",
        "Establish content quality standards",
        "Build initial community guidelines"
      ],
      metrics: ["100 DAU", "500 questions", "1,000 answers", "5,000 DVT tips"],
      budget: "$50K"
    },
    {
      phase: "Phase 2: Growth (Months 4-9)",
      objectives: [
        "Implement AI assistant features",
        "Launch referral program",
        "Partner with coding bootcamps",
        "Introduce premium features"
      ],
      metrics: ["1,000 DAU", "5,000 questions", "15,000 answers", "50,000 DVT tips"],
      budget: "$200K"
    },
    {
      phase: "Phase 3: Scale (Months 10-18)",
      objectives: [
        "Enterprise partnerships",
        "Mobile app launch",
        "International expansion",
        "Advanced analytics dashboard"
      ],
      metrics: ["10,000 DAU", "25,000 questions", "100,000 answers", "500,000 DVT tips"],
      budget: "$500K"
    }
  ];

  const acquisitionChannels = [
    {
      channel: "Developer Communities",
      strategy: "Engage in Reddit, Discord, and Slack communities",
      cost: "Low",
      impact: "High",
      timeline: "Immediate"
    },
    {
      channel: "Content Marketing",
      strategy: "Technical blog posts, tutorials, and case studies",
      cost: "Medium",
      impact: "High",
      timeline: "3-6 months"
    },
    {
      channel: "Influencer Partnerships",
      strategy: "Collaborate with tech YouTubers and Twitter influencers",
      cost: "Medium",
      impact: "Medium",
      timeline: "1-3 months"
    },
    {
      channel: "Conference Sponsorships",
      strategy: "Sponsor developer conferences and hackathons",
      cost: "High",
      impact: "Medium",
      timeline: "6-12 months"
    }
  ];

  return (
    <div className={styles.gtmStrategy}>
      <div className={styles.header}>
        <h1>Go-to-Market Strategy</h1>
        <p>Comprehensive strategy to disrupt the developer Q&A market</p>
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.marketSize}>
              <h2>Market Opportunity</h2>
              <div className={styles.sizeCards}>
                <div className={styles.sizeCard}>
                  <h3>TAM</h3>
                  <p className={styles.amount}>{marketInsights.marketSize.tam}</p>
                  <small>Total Addressable Market</small>
                </div>
                <div className={styles.sizeCard}>
                  <h3>SAM</h3>
                  <p className={styles.amount}>{marketInsights.marketSize.sam}</p>
                  <small>Serviceable Addressable Market</small>
                </div>
                <div className={styles.sizeCard}>
                  <h3>SOM</h3>
                  <p className={styles.amount}>{marketInsights.marketSize.som}</p>
                  <small>Serviceable Obtainable Market</small>
                </div>
              </div>
            </div>

            <div className={styles.trends}>
              <h2>Market Trends</h2>
              <ul>
                {marketInsights.marketTrends.map((trend, index) => (
                  <li key={index}>{trend}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'personas' && (
          <div className={styles.personas}>
            <h2>Target User Personas</h2>
            <div className={styles.personaGrid}>
              {marketInsights.userPersonas.map((persona, index) => (
                <div key={index} className={styles.personaCard}>
                  <h3>{persona.name}</h3>
                  <div className={styles.personaSection}>
                    <h4>Pain Points</h4>
                    <ul>
                      {persona.painPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.personaSection}>
                    <h4>Motivations</h4>
                    <ul>
                      {persona.motivations.map((motivation, i) => (
                        <li key={i}>{motivation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'competition' && (
          <div className={styles.competition}>
            <h2>Competitive Analysis</h2>
            <div className={styles.competitorGrid}>
              {marketInsights.competitorAnalysis.map((competitor, index) => (
                <div key={index} className={styles.competitorCard}>
                  <div className={styles.competitorHeader}>
                    <h3>{competitor.name}</h3>
                    <span className={styles.marketShare}>{competitor.marketShare}</span>
                  </div>
                  <div className={styles.competitorSection}>
                    <h4>Strengths</h4>
                    <ul>
                      {competitor.strengths.map((strength, i) => (
                        <li key={i} className={styles.strength}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.competitorSection}>
                    <h4>Weaknesses</h4>
                    <ul>
                      {competitor.weaknesses.map((weakness, i) => (
                        <li key={i} className={styles.weakness}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className={styles.strategy}>
            <div className={styles.phases}>
              <h2>Launch Phases</h2>
              {gtmPhases.map((phase, index) => (
                <div key={index} className={styles.phaseCard}>
                  <div className={styles.phaseHeader}>
                    <h3>{phase.phase}</h3>
                    <span className={styles.budget}>{phase.budget}</span>
                  </div>
                  <div className={styles.phaseContent}>
                    <div className={styles.objectives}>
                      <h4>Objectives</h4>
                      <ul>
                        {phase.objectives.map((objective, i) => (
                          <li key={i}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.metrics}>
                      <h4>Success Metrics</h4>
                      <div className={styles.metricTags}>
                        {phase.metrics.map((metric, i) => (
                          <span key={i} className={styles.metricTag}>{metric}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.acquisition}>
              <h2>Customer Acquisition Channels</h2>
              <div className={styles.channelGrid}>
                {acquisitionChannels.map((channel, index) => (
                  <div key={index} className={styles.channelCard}>
                    <h3>{channel.channel}</h3>
                    <p>{channel.strategy}</p>
                    <div className={styles.channelMetrics}>
                      <span className={`${styles.cost} ${styles[channel.cost.toLowerCase()]}`}>
                        {channel.cost} Cost
                      </span>
                      <span className={`${styles.impact} ${styles[channel.impact.toLowerCase()]}`}>
                        {channel.impact} Impact
                      </span>
                      <span className={styles.timeline}>
                        <Calendar size={16} />
                        {channel.timeline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GTMStrategy;
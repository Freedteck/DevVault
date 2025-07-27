import topicMessageFnc from '../client/topicMessage';

class MarketFeedbackService {
  constructor() {
    this.feedbackTopicId = import.meta.env.VITE_FEEDBACK_TOPIC_ID;
  }

  async submitFeedback(feedbackData, walletData, accountId) {
    try {
      const feedback = {
        ...feedbackData,
        timestamp: new Date().toISOString(),
        accountId,
        id: `feedback_${Date.now()}`
      };

      await topicMessageFnc(
        walletData,
        accountId,
        this.feedbackTopicId,
        feedback
      );

      return feedback;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getFeedback() {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/topics/${this.feedbackTopicId}/messages`
      );
      const data = await response.json();

      const feedback = data.messages.map(message => {
        const decodedMessage = atob(message.message);
        return JSON.parse(decodedMessage);
      });

      return feedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  }

  async analyzeFeedback() {
    const feedback = await this.getFeedback();
    
    const analysis = {
      totalResponses: feedback.length,
      averageRating: 0,
      sentimentBreakdown: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      topFeatureRequests: {},
      userSatisfaction: 0,
      nps: 0
    };

    let totalRating = 0;
    let npsPromotors = 0;
    let npsDetractors = 0;

    feedback.forEach(item => {
      if (item.rating) {
        totalRating += item.rating;
        
        if (item.rating >= 9) npsPromotors++;
        else if (item.rating <= 6) npsDetractors++;
      }

      if (item.sentiment) {
        analysis.sentimentBreakdown[item.sentiment]++;
      }

      if (item.featureRequest) {
        analysis.topFeatureRequests[item.featureRequest] = 
          (analysis.topFeatureRequests[item.featureRequest] || 0) + 1;
      }
    });

    analysis.averageRating = totalRating / Math.max(1, feedback.filter(f => f.rating).length);
    analysis.userSatisfaction = (analysis.averageRating / 10) * 100;
    analysis.nps = ((npsPromotors - npsDetractors) / Math.max(1, feedback.length)) * 100;

    return analysis;
  }

  generateMarketInsights() {
    return {
      marketSize: {
        tam: "$50B", // Total Addressable Market
        sam: "$5B",  // Serviceable Addressable Market
        som: "$500M" // Serviceable Obtainable Market
      },
      competitorAnalysis: [
        {
          name: "Stack Overflow",
          marketShare: "65%",
          weaknesses: ["No direct incentives", "Outdated UI", "Limited monetization for users"],
          strengths: ["Large user base", "SEO dominance", "Brand recognition"]
        },
        {
          name: "GitHub Discussions",
          marketShare: "15%",
          weaknesses: ["Limited to GitHub ecosystem", "No tipping system"],
          strengths: ["Developer-focused", "Integration with code"]
        },
        {
          name: "Reddit (r/programming)",
          marketShare: "10%",
          weaknesses: ["General purpose", "No quality incentives"],
          strengths: ["Active community", "Diverse topics"]
        }
      ],
      marketTrends: [
        "Increasing demand for developer incentivization",
        "Growth in blockchain adoption among developers",
        "Rise of AI-assisted development",
        "Remote work driving online collaboration"
      ],
      userPersonas: [
        {
          name: "Senior Developer",
          painPoints: ["Time constraints", "Knowledge sharing without rewards"],
          motivations: ["Recognition", "Passive income", "Helping others"]
        },
        {
          name: "Junior Developer",
          painPoints: ["Learning curve", "Finding quality answers"],
          motivations: ["Skill development", "Career growth", "Community"]
        },
        {
          name: "Tech Lead",
          painPoints: ["Team knowledge gaps", "Keeping up with trends"],
          motivations: ["Team efficiency", "Industry insights", "Thought leadership"]
        }
      ]
    };
  }
}

export default new MarketFeedbackService();
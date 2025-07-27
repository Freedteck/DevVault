import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

class LLMService {
  constructor() {
    this.trainingData = [];
    this.modelMetrics = {
      totalQuestions: 0,
      totalAnswers: 0,
      qualityScore: 0,
      dataPoints: 0
    };
  }

  async generateAnswer(question, context = []) {
    try {
      const prompt = this.buildPrompt(question, context);
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful developer assistant trained on high-quality Q&A data from DevVault. Provide accurate, helpful answers to programming questions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI answer:', error);
      return null;
    }
  }

  buildPrompt(question, context) {
    let prompt = `Question: ${question}\n\n`;
    
    if (context.length > 0) {
      prompt += "Related context from DevVault:\n";
      context.forEach((item, index) => {
        prompt += `${index + 1}. ${item.title}: ${item.description}\n`;
      });
      prompt += "\n";
    }
    
    prompt += "Please provide a helpful answer based on the context and your knowledge:";
    return prompt;
  }

  async analyzeContentQuality(content) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze the quality of this developer content. Rate it from 1-10 and provide feedback on clarity, accuracy, and helpfulness."
          },
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 200
      });

      const analysis = response.choices[0].message.content;
      const scoreMatch = analysis.match(/(\d+)\/10|\b(\d+)\b/);
      const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 5;
      
      return {
        score,
        feedback: analysis,
        isHighQuality: score >= 7
      };
    } catch (error) {
      console.error('Error analyzing content quality:', error);
      return { score: 5, feedback: "Unable to analyze", isHighQuality: false };
    }
  }

  async extractTrainingData(discussions) {
    const trainingData = [];
    
    for (const discussion of discussions) {
      if (discussion.type === 'question' && discussion.answers?.length > 0) {
        const bestAnswer = discussion.answers.reduce((best, current) => 
          (current.tips || 0) > (best.tips || 0) ? current : best
        );
        
        const quality = await this.analyzeContentQuality(
          `Q: ${discussion.title}\nA: ${bestAnswer.text}`
        );
        
        if (quality.isHighQuality) {
          trainingData.push({
            question: discussion.title,
            answer: bestAnswer.text,
            quality: quality.score,
            tips: bestAnswer.tips || 0,
            timestamp: discussion.date
          });
        }
      }
    }
    
    this.trainingData = trainingData;
    this.updateMetrics();
    return trainingData;
  }

  updateMetrics() {
    this.modelMetrics = {
      totalQuestions: this.trainingData.length,
      totalAnswers: this.trainingData.length,
      qualityScore: this.trainingData.reduce((sum, item) => sum + item.quality, 0) / this.trainingData.length || 0,
      dataPoints: this.trainingData.length
    };
  }

  getMetrics() {
    return this.modelMetrics;
  }

  async suggestSimilarQuestions(question) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate 3 similar programming questions that developers might ask related to the given question."
          },
          {
            role: "user",
            content: question
          }
        ],
        max_tokens: 200
      });

      const suggestions = response.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3);
      
      return suggestions;
    } catch (error) {
      console.error('Error generating similar questions:', error);
      return [];
    }
  }
}

export default new LLMService();
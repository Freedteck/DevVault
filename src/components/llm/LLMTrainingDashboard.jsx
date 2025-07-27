import { useState, useEffect, useContext } from 'react';
import { Brain, Database, TrendingUp, Award, Download, Upload } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import styles from './LLMTrainingDashboard.module.css';
import Button from '../button/Button';
import { userWalletContext } from '../../context/userWalletContext';
import llmService from '../../services/llmService';
import topicMessageFnc from '../../client/topicMessage';
import toast from 'react-hot-toast';

const LLMTrainingDashboard = () => {
  const { accountId, walletData } = useContext(userWalletContext);
  const [trainingData, setTrainingData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [discussions, setDiscussions] = useState([]);
  const [qualityDistribution, setQualityDistribution] = useState([]);

  const topicId = import.meta.env.VITE_TOPIC_ID;
  const llmTrainingTopicId = import.meta.env.VITE_LLM_TRAINING_TOPIC_ID;

  useEffect(() => {
    fetchDiscussions();
    loadMetrics();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
      );
      const data = await response.json();

      const messages = data.messages.map((message) => {
        const decodedMessage = atob(message.message);
        return JSON.parse(decodedMessage);
      });

      setDiscussions(messages);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const loadMetrics = () => {
    const currentMetrics = llmService.getMetrics();
    setMetrics(currentMetrics);
  };

  const extractTrainingData = async () => {
    if (!accountId) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsExtracting(true);
    try {
      const extractedData = await llmService.extractTrainingData(discussions);
      setTrainingData(extractedData);
      
      // Update quality distribution
      const distribution = [
        { quality: '1-3', count: extractedData.filter(d => d.quality <= 3).length },
        { quality: '4-6', count: extractedData.filter(d => d.quality >= 4 && d.quality <= 6).length },
        { quality: '7-8', count: extractedData.filter(d => d.quality >= 7 && d.quality <= 8).length },
        { quality: '9-10', count: extractedData.filter(d => d.quality >= 9).length }
      ];
      setQualityDistribution(distribution);

      // Store training data on Hedera
      const trainingMetadata = {
        type: 'llm_training_data',
        totalDataPoints: extractedData.length,
        averageQuality: extractedData.reduce((sum, item) => sum + item.quality, 0) / extractedData.length,
        extractedAt: new Date().toISOString(),
        accountId
      };

      await topicMessageFnc(
        walletData,
        accountId,
        llmTrainingTopicId,
        trainingMetadata
      );

      loadMetrics();
      toast.success(`Extracted ${extractedData.length} high-quality training data points!`);
    } catch (error) {
      console.error('Error extracting training data:', error);
      toast.error('Failed to extract training data');
    } finally {
      setIsExtracting(false);
    }
  };

  const exportTrainingData = () => {
    if (trainingData.length === 0) {
      toast.error('No training data to export');
      return;
    }

    const dataStr = JSON.stringify(trainingData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `devvault_training_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Training data exported successfully!');
  };

  const qualityTrendData = [
    { month: 'Jan', quality: 6.2 },
    { month: 'Feb', quality: 6.8 },
    { month: 'Mar', quality: 7.1 },
    { month: 'Apr', quality: 7.5 },
    { month: 'May', quality: 7.8 },
    { month: 'Jun', quality: 8.2 }
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Brain className={styles.brainIcon} />
          <div>
            <h1>LLM Training Dashboard</h1>
            <p>Transform DevVault's Q&A data into high-quality training datasets for AI models</p>
          </div>
        </div>
        <div className={styles.actions}>
          <Button 
            text={isExtracting ? "Extracting..." : "Extract Training Data"}
            handleClick={extractTrainingData}
            btnClass={isExtracting ? "secondary" : "primary"}
          />
          <Button 
            text="Export Data"
            handleClick={exportTrainingData}
            btnClass="secondary"
          />
        </div>
      </div>

      {metrics && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <Database />
            </div>
            <div className={styles.metricContent}>
              <h3>{metrics.dataPoints.toLocaleString()}</h3>
              <p>Training Data Points</p>
            </div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <Award />
            </div>
            <div className={styles.metricContent}>
              <h3>{metrics.qualityScore.toFixed(1)}/10</h3>
              <p>Average Quality Score</p>
            </div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <TrendingUp />
            </div>
            <div className={styles.metricContent}>
              <h3>{((metrics.dataPoints / discussions.length) * 100).toFixed(1)}%</h3>
              <p>Data Utilization Rate</p>
            </div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <Brain />
            </div>
            <div className={styles.metricContent}>
              <h3>{metrics.totalQuestions.toLocaleString()}</h3>
              <p>Q&A Pairs</p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Quality Score Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={qualityTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="quality" 
                stroke="#535bf2" 
                strokeWidth={3}
                dot={{ fill: '#535bf2', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Quality Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={qualityDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quality" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#535bf2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.dataPreview}>
        <h3>Training Data Preview</h3>
        {trainingData.length > 0 ? (
          <div className={styles.dataTable}>
            <div className={styles.tableHeader}>
              <span>Question</span>
              <span>Answer Preview</span>
              <span>Quality</span>
              <span>Tips</span>
            </div>
            {trainingData.slice(0, 5).map((item, index) => (
              <div key={index} className={styles.tableRow}>
                <span className={styles.question}>
                  {item.question.substring(0, 50)}...
                </span>
                <span className={styles.answer}>
                  {item.answer.substring(0, 80)}...
                </span>
                <span className={`${styles.quality} ${styles[`quality${Math.floor(item.quality)}`]}`}>
                  {item.quality}/10
                </span>
                <span className={styles.tips}>{item.tips}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noData}>
            <Database size={48} />
            <p>No training data extracted yet</p>
            <small>Click "Extract Training Data" to analyze Q&A content and generate training datasets</small>
          </div>
        )}
      </div>

      <div className={styles.insights}>
        <h3>AI Training Insights</h3>
        <div className={styles.insightGrid}>
          <div className={styles.insightCard}>
            <h4>Data Quality</h4>
            <p>High-quality answers with 7+ ratings are automatically selected for training</p>
          </div>
          <div className={styles.insightCard}>
            <h4>Tip Correlation</h4>
            <p>Answers with more tips tend to have higher quality scores and better training value</p>
          </div>
          <div className={styles.insightCard}>
            <h4>Domain Coverage</h4>
            <p>Training data covers diverse programming topics ensuring comprehensive AI knowledge</p>
          </div>
          <div className={styles.insightCard}>
            <h4>Continuous Learning</h4>
            <p>New Q&A pairs are continuously evaluated and added to the training dataset</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMTrainingDashboard;
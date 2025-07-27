import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, MessageSquare, DollarSign } from 'lucide-react';
import styles from './AnalyticsDashboard.module.css';
import analyticsService from '../../services/analyticsService';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsData, insightsData] = await Promise.all([
          analyticsService.getAnalytics(),
          analyticsService.generateInsights()
        ]);
        
        setAnalytics(analyticsData);
        setInsights(insightsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const COLORS = ['#535bf2', '#646cff', '#f2f2f2', '#e6e6e6'];

  const engagementData = [
    { name: 'Mon', users: 120 },
    { name: 'Tue', users: 150 },
    { name: 'Wed', users: 180 },
    { name: 'Thu', users: 200 },
    { name: 'Fri', users: 170 },
    { name: 'Sat', users: 140 },
    { name: 'Sun', users: 110 }
  ];

  const contentData = [
    { name: 'Questions', value: analytics?.contentPerformance?.questionsAsked || 0 },
    { name: 'Answers', value: analytics?.contentPerformance?.answersProvided || 0 },
    { name: 'Updates', value: 45 },
    { name: 'Comments', value: 120 }
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Analytics Dashboard</h1>
        <p>Real-time insights into platform performance and user engagement</p>
      </div>

      {insights && (
        <div className={styles.metricsGrid}>
          {insights.keyMetrics.map((metric, index) => (
            <div key={index} className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={styles.metricIcon}>
                  {index === 0 && <Users />}
                  {index === 1 && <MessageSquare />}
                  {index === 2 && <DollarSign />}
                  {index === 3 && <TrendingUp />}
                </div>
                <span className={`${styles.trend} ${styles[metric.color]}`}>
                  {metric.trend}
                </span>
              </div>
              <h3>{metric.value.toLocaleString()}</h3>
              <p>{metric.title}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Daily Active Users</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#535bf2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Content Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {contentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Weekly Tips Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { day: 'Mon', tips: 25 },
              { day: 'Tue', tips: 35 },
              { day: 'Wed', tips: 45 },
              { day: 'Thu', tips: 55 },
              { day: 'Fri', tips: 40 },
              { day: 'Sat', tips: 30 },
              { day: 'Sun', tips: 20 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tips" fill="#535bf2" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.insightsCard}>
          <h3>Key Insights</h3>
          <ul>
            {insights?.insights?.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
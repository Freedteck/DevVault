import { useState, useContext } from 'react';
import { Star, Send, X } from 'lucide-react';
import PropTypes from 'prop-types';
import styles from './FeedbackModal.module.css';
import Button from '../button/Button';
import { userWalletContext } from '../../context/userWalletContext';
import marketFeedbackService from '../../services/marketFeedbackService';
import toast from 'react-hot-toast';

const FeedbackModal = ({ isOpen, onClose }) => {
  const { accountId, walletData } = useContext(userWalletContext);
  const [formData, setFormData] = useState({
    rating: 0,
    category: '',
    feedback: '',
    featureRequest: '',
    email: '',
    userType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accountId) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (formData.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        ...formData,
        sentiment: formData.rating >= 8 ? 'positive' : formData.rating >= 6 ? 'neutral' : 'negative',
        timestamp: new Date().toISOString()
      };

      await marketFeedbackService.submitFeedback(feedbackData, walletData, accountId);
      
      toast.success('Thank you for your feedback!');
      onClose();
      
      // Reset form
      setFormData({
        rating: 0,
        category: '',
        feedback: '',
        featureRequest: '',
        email: '',
        userType: ''
      });
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Share Your Feedback</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <label>How would you rate DevVault overall?</label>
            <div className={styles.rating}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${star <= formData.rating ? styles.active : ''}`}
                  onClick={() => handleRatingClick(star)}
                >
                  <Star size={20} />
                  <span>{star}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <label htmlFor="category">Feedback Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category</option>
              <option value="user-experience">User Experience</option>
              <option value="features">Features</option>
              <option value="performance">Performance</option>
              <option value="design">Design</option>
              <option value="monetization">Monetization</option>
              <option value="community">Community</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.section}>
            <label htmlFor="userType">I am a...</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select your role</option>
              <option value="junior-developer">Junior Developer</option>
              <option value="senior-developer">Senior Developer</option>
              <option value="tech-lead">Tech Lead</option>
              <option value="engineering-manager">Engineering Manager</option>
              <option value="freelancer">Freelancer</option>
              <option value="student">Student</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.section}>
            <label htmlFor="feedback">Your Feedback</label>
            <textarea
              id="feedback"
              name="feedback"
              value={formData.feedback}
              onChange={handleInputChange}
              placeholder="Tell us what you think about DevVault..."
              rows={4}
              required
            />
          </div>

          <div className={styles.section}>
            <label htmlFor="featureRequest">Feature Request (Optional)</label>
            <textarea
              id="featureRequest"
              name="featureRequest"
              value={formData.featureRequest}
              onChange={handleInputChange}
              placeholder="What features would you like to see?"
              rows={3}
            />
          </div>

          <div className={styles.section}>
            <label htmlFor="email">Email (Optional)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
            />
            <small>We'll only use this to follow up on your feedback</small>
          </div>

          <div className={styles.actions}>
            <Button 
              text={isSubmitting ? "Submitting..." : "Submit Feedback"}
              btnClass="primary"
              handleClick={() => {}}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

FeedbackModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default FeedbackModal;
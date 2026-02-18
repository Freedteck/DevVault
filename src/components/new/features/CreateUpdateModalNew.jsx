import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Modal from '../ui/Modal';
import NeonButton from '../ui/NeonButton';
import styles from './CreateQuestionModal.module.css'; // Reusing forms styles

const CreateUpdateModalNew = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    tags: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting update:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post an Update">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input 
            className={styles.input}
            placeholder="e.g. Hedera Council approves new HIP"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea 
            className={styles.textarea}
            placeholder="Summarize the news or update..."
            rows={4}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Link URL (Optional)</label>
          <input 
            className={styles.input}
            placeholder="https://..."
            value={formData.url}
            onChange={e => setFormData({...formData, url: e.target.value})}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tags</label>
          <input 
            className={styles.input}
            placeholder="news, governance, tools"
            value={formData.tags}
            onChange={e => setFormData({...formData, tags: e.target.value})}
          />
        </div>

        <div className={styles.actions}>
          <NeonButton variant="ghost" type="button" onClick={onClose}>
            Cancel
          </NeonButton>
          <NeonButton variant="cyan" type="submit" icon={<Send size={16} />}>
            Post Update
          </NeonButton>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUpdateModalNew;

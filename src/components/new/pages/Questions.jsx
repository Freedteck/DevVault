import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import FilterBar from '../features/FilterBar';
import QuestionCardNew from '../features/QuestionCardNew';
import NeonButton from '../ui/NeonButton';
import CreateQuestionModalNew from '../features/CreateQuestionModalNew';
import { MOCK_QUESTIONS } from '../data/mock';
import styles from './Questions.module.css';

const QuestionsNew = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('newest');

  const filteredQuestions = MOCK_QUESTIONS.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeFilter === 'bounties') {
      return matchesSearch && q.bounty > 0;
    }
    
    return matchesSearch;
  });

  // Sort by date if 'newest'
  if (activeFilter === 'newest') {
    filteredQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Questions Feed</h1>
          <p className={styles.subtitle}>
            Earn crypto by solving real-world development challenges.
          </p>
        </div>
        <NeonButton icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          Ask Question
        </NeonButton>
      </div>

      <CreateQuestionModalNew isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Inputs */}
      <FilterBar onSearch={setSearchTerm} onFilterChange={setActiveFilter} />

      {/* Grid */}
      <div className={styles.grid}>
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map(q => (
            <QuestionCardNew key={q.id} question={q} />
          ))
        ) : (
          <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--apex-text-muted)'}}>
            No questions found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsNew;

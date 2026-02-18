import React, { useState } from 'react';
import { Newspaper } from 'lucide-react';
import FilterBar from '../features/FilterBar';
import UpdateCardNew from '../features/UpdateCardNew';
import NeonButton from '../ui/NeonButton';
import CreateUpdateModalNew from '../features/CreateUpdateModalNew';
import { MOCK_UPDATES } from '../data/mock';
import styles from './Updates.module.css';

const UpdatesNew = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('newest');

  const filteredUpdates = MOCK_UPDATES.filter(u => {
    const matchesSearch = u.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.author.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    // In updates, 'bounties' might not be applicable, but we can filter by 'pinned' or 'news' if meta exists
    // For now, let's just keep search and newest sort
    return matchesSearch;
  });

  if (activeFilter === 'newest') {
    filteredUpdates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
           <h1 className={styles.title}>Developer News</h1>
           <p className={styles.subtitle}>Latest updates from the Hedera ecosystem.</p>
        </div>
        <NeonButton variant="cyan" icon={<Newspaper size={18} />} onClick={() => setIsModalOpen(true)}>
          Submit News
        </NeonButton>
      </div>

      <CreateUpdateModalNew isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <FilterBar onSearch={setSearchTerm} onFilterChange={setActiveFilter} />

      <div className={styles.grid}>
        {filteredUpdates.length > 0 ? (
          filteredUpdates.map(update => (
            <UpdateCardNew key={update.id} update={update} />
          ))
        ) : (
          <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--apex-text-muted)'}}>
            No news found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesNew;

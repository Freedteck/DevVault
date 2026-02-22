"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import NeonButton from "../ui/NeonButton";
import CreateQuestionModalNew from "./CreateQuestionModalNew";
import FilterBar from "./FilterBar";
import QuestionsFeed from "./QuestionsFeed";
import styles from "../../app/questions/questions.module.css";

interface QuestionsPageMainProps {
  initialData?: any;
}

export default function QuestionsPageMain({
  initialData,
}: QuestionsPageMainProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("newest");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Questions Feed</h1>
          <p className={styles.subtitle}>
            Earn crypto by solving real-world development challenges.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <NeonButton
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={16} />}
            onClick={handleRefresh}
          >
            Refresh
          </NeonButton>
          <NeonButton
            icon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Ask Question
          </NeonButton>
        </div>
      </div>

      <CreateQuestionModalNew
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          handleRefresh();
        }}
      />

      <FilterBar onSearch={setSearchTerm} onFilterChange={setActiveFilter} />

      <QuestionsFeed
        key={refreshKey}
        searchTerm={searchTerm}
        activeFilter={activeFilter}
        initialData={initialData}
      />
    </div>
  );
}

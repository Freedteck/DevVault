"use client";

import { useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import NeonButton from "../ui/NeonButton";
import CreateUpdateModalNew from "./CreateUpdateModalNew";
import FilterBar from "./FilterBar";
import UpdatesFeed from "./UpdatesFeed";
import styles from "../../components/pages/Updates.module.css";

interface UpdatesPageMainProps {
  initialData?: any;
}

export default function UpdatesPageMain({ initialData }: UpdatesPageMainProps) {
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
          <h1 className={styles.title}>Developer News</h1>
          <p className={styles.subtitle}>
            Latest updates from the Hedera ecosystem.
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
            variant="cyan"
            icon={<Newspaper size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Submit News
          </NeonButton>
        </div>
      </div>

      <CreateUpdateModalNew
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          handleRefresh();
        }}
      />

      <FilterBar
        onSearch={setSearchTerm}
        onFilterChange={setActiveFilter}
        showBounty={false}
      />

      <UpdatesFeed
        key={refreshKey}
        searchTerm={searchTerm}
        activeFilter={activeFilter}
        initialData={initialData}
      />
    </div>
  );
}

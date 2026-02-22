import React from "react";
import { Search, Filter, Hash } from "lucide-react";
import styles from "./FilterBar.module.css";
interface FilterBarProps {
  onSearch?: (term: string) => void;
  onFilterChange?: (filter: string) => void;
  showBounty?: boolean;
}

const FilterBar = ({
  onSearch,
  onFilterChange,
  showBounty = true,
}: FilterBarProps) => {
  const [activeFilter, setActiveFilter] = React.useState("newest");

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    if (onFilterChange) onFilterChange(filter);
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          placeholder="Search questions, bounties, or tags..."
          className={styles.searchInput}
          onChange={(e) => onSearch && onSearch((e.target as any).value)}
        />
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.filterBtn} ${activeFilter === "newest" ? styles.active : ""}`}
          onClick={() => handleFilterClick("newest")}
        >
          <Filter size={16} />
          <span>Newest</span>
        </button>
        {showBounty && (
          <button
            className={`${styles.filterBtn} ${activeFilter === "bounties" ? styles.active : ""}`}
            onClick={() => handleFilterClick("bounties")}
          >
            <Hash size={16} />
            <span>Bounties</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

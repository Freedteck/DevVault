"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "@/components/ui/primitives";

interface SearchResult {
  type: "QUESTION" | "UPDATE";
  id: string;
  title: string;
  description: string;
  timestamp: string;
  author: string;
}

interface GlobalSearchProps {
  onClose?: () => void;
  autoFocus?: boolean;
}

export function GlobalSearch({ onClose, autoFocus }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    const path =
      result.type === "QUESTION"
        ? `/questions/${result.id}`
        : `/updates/${result.id}`;
    router.push(path);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        {isSearching ? (
          <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search Questions or Updates..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full pl-9 pr-10 py-1.5 text-sm rounded-md border outline-none bg-bg-subtle border-border-main text-text-main focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner"
      />

      {/* Clear/Close Button */}
      {(query || onClose) && (
        <button
          onClick={() => {
            if (query) setQuery("");
            else if (onClose) onClose();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-panel border border-border-main rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl bg-opacity-95">
          <div className="max-h-[70vh] overflow-y-auto">
            {results.length > 0 ? (
              <div className="divide-y divide-border-main/50">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left p-3 flex flex-col gap-1 transition-colors ${
                      selectedIndex === index
                        ? "bg-primary-600/10"
                        : "hover:bg-bg-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                          result.type === "QUESTION"
                            ? "bg-primary-900/30 text-primary-400"
                            : "bg-accent-950/30 text-accent-400"
                        }`}
                      >
                        {result.type}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {result.author}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-text-main truncate">
                      {result.title}
                    </h4>
                    <p className="text-xs text-text-muted line-clamp-1 italic">
                      {result.description}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                {isSearching ? (
                  <p className="text-sm text-text-muted animate-pulse italic">
                    Scanning the Den...
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-text-main font-medium">
                      No results found for "{query}"
                    </p>
                    <p className="text-xs text-text-muted">
                      Try more general keywords or check your spelling.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-bg-subtle border-t border-border-main p-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] text-text-muted">
                <kbd className="px-1 py-0.5 rounded border border-border-main bg-bg-panel text-[8px]">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1 text-[9px] text-text-muted">
                <kbd className="px-1 py-0.5 rounded border border-border-main bg-bg-panel text-[8px]">
                  ↵
                </kbd>
                Select
              </span>
            </div>
            <span className="text-[9px] text-text-muted font-mono italic">
              Recent activity sync enabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

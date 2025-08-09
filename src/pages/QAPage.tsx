import { useState, useEffect, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostCard } from "@/components/posts/post-card";
import { TagBadge } from "@/components/shared/tag-badge";
import { Card, CardContent } from "@/components/ui/card";
import { MIN_SEARCH_CHARS } from "@/lib/constants";
import { toast } from "sonner";
import { contentData } from "@/context/ContentData";

const sortOptions = [
  { label: "Most Recent", value: "recent" },
  { label: "Most Voted", value: "votes" },
  { label: "Most Viewed", value: "views" },
  { label: "Most Tips", value: "tips" },
];

const ITEMS_PER_PAGE = 10;

export default function QAPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const { isLoading, questions } = useContext(contentData);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag, sortBy]);

  // Filtered and sorted questions
  const processedQuestions = useMemo(() => {
    let filtered = questions;

    // Apply filters here based on searchQuery and selectedTag
    // This is where you'd implement your actual filtering logic

    return filtered;
  }, [questions, searchQuery, selectedTag, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(processedQuestions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentQuestions = processedQuestions.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim().length < MIN_SEARCH_CHARS) {
      toast.error(
        `Search query must be at least ${MIN_SEARCH_CHARS} characters`
      );
      return;
    }
  };

  const searchPosts = async () => {};

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setSearchQuery("");
  };

  const clearFilters = () => {
    setSelectedTag(null);
    setSearchQuery("");
    setSortBy("recent");
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Q&A</h1>
        <Link to="/create">
          <Button>Ask a Question</Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <form onSubmit={handleSearch} className="relative md:col-span-2">
          <Input
            type="search"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full"
            disabled={searchQuery.trim().length < MIN_SEARCH_CHARS}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="sr-only">Search</span>
          </Button>
        </form>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Tags:</span>
        {selectedTag ? (
          <>
            <TagBadge tag={selectedTag} />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => handleTagSelect(null)}
            >
              Clear
            </Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">All</span>
        )}

        {(selectedTag || searchQuery || sortBy !== "recent") && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Results Info */}
      {!isLoading && processedQuestions.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1}-
            {Math.min(endIndex, processedQuestions.length)} of{" "}
            {processedQuestions.length} questions
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Q&A Posts */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-16">Loading Q&A posts...</div>
        ) : currentQuestions.length > 0 ? (
          currentQuestions.map((post) => (
            <PostCard key={post.data.id} post={post} />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-lg font-medium mb-2">No questions found</h3>
              <p className="text-center text-muted-foreground mb-4">
                {selectedTag
                  ? `There are no questions with the tag "${selectedTag}"`
                  : searchQuery
                  ? "No questions match your search criteria"
                  : "Be the first to ask a question!"}
              </p>
              <div className="flex space-x-4">
                {(selectedTag || searchQuery) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Link to="/create">
                  <Button>Ask a Question</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && processedQuestions.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === "..." ? (
                  <span className="px-3 py-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => goToPage(page as number)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}

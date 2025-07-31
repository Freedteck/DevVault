import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Post, Tag } from "@/types";
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

export default function QAPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("recent");
  const { isLoading, questions } = useContext(contentData);

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

      {/* Popular Tags */}
      {/* <div className="flex flex-wrap gap-2 mb-4">
        {popularTags.map((tag) => (
          <Button
            key={tag.id}
            variant={selectedTag === tag.name ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => handleTagSelect(tag.name)}
          >
            {tag.name}
            <span className="ml-1 text-xs">({tag.count})</span>
          </Button>
        ))}
      </div> */}

      {/* Q&A Posts */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-16">Loading Q&A posts...</div>
        ) : questions.length > 0 ? (
          questions.map((post) => <PostCard key={post.data.id} post={post} />)
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
    </div>
  );
}

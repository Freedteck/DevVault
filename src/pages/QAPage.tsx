import { useState, useEffect } from "react";
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
import apiService from "@/services/api-service";
import { toast } from "sonner";

const sortOptions = [
  { label: "Most Recent", value: "recent" },
  { label: "Most Voted", value: "votes" },
  { label: "Most Viewed", value: "views" },
  { label: "Most Tips", value: "tips" },
];

export default function QAPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedTag, sortBy]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Q&A posts
      const fetchedPosts = await apiService.getPosts("QA", selectedTag || undefined);
      
      // Sort posts based on the selected sort option
      const sortedPosts = [...fetchedPosts].sort((a, b) => {
        switch (sortBy) {
          case "votes":
            return b.votes - a.votes;
          case "views":
            return b.viewCount - a.viewCount;
          case "tips":
            return b.tipAmount - a.tipAmount;
          case "recent":
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
      
      setPosts(sortedPosts);
      
      // Fetch popular tags
      const fetchedTags = await apiService.getTags();
      setPopularTags(fetchedTags.slice(0, 20)); // Top 20 tags
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load Q&A posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim().length < MIN_SEARCH_CHARS) {
      toast.error(`Search query must be at least ${MIN_SEARCH_CHARS} characters`);
      return;
    }
    
    searchPosts();
  };

  const searchPosts = async () => {
    try {
      setIsLoading(true);
      
      const fetchedPosts = await apiService.search(searchQuery);
      // Filter for only Q&A posts
      const qaResults = fetchedPosts.filter(post => post.category === "QA");
      
      setPosts(qaResults);
      
      if (qaResults.length === 0) {
        toast.info("No Q&A posts found matching your search");
      }
    } catch (error) {
      console.error("Error searching posts:", error);
      toast.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setSearchQuery("");
  };

  const clearFilters = () => {
    setSelectedTag(null);
    setSearchQuery("");
    setSortBy("recent");
    fetchData();
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
      <div className="flex flex-wrap gap-2 mb-4">
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
      </div>
      
      {/* Q&A Posts */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-16">Loading Q&A posts...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
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
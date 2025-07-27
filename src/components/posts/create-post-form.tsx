import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TagInput } from "@/components/shared/tag-input";
import { ContentCategory } from "@/types";
import apiService from "@/services/api-service";
import llmService from "@/services/llm-service";
import { toast } from "sonner";

export function CreatePostForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ContentCategory>("QA");
  const [tags, setTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      toast.error("You must be logged in to create a post");
    }
  }, [user, navigate]);

  const handleCategoryChange = (value: string) => {
    setCategory(value as ContentCategory);
  };

  const handleTagsChange = (newTags: string[]) => {
    // Limit to 5 tags
    setTags(newTags.slice(0, 5));
  };

  const handleSuggestTags = async () => {
    if (!content || content.length < 50) {
      toast.error("Please add more content before suggesting tags");
      return;
    }
    
    try {
      setIsSuggestingTags(true);
      const suggested = await llmService.suggestTags(content);
      setSuggestedTags(suggested);
      
      if (suggested.length > 0) {
        toast.success("Tags suggested based on your content");
      } else {
        toast.info("No tags could be suggested. Try adding more specific content.");
      }
    } catch (error) {
      console.error("Error suggesting tags:", error);
      toast.error("Failed to suggest tags");
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    
    if (tags.length === 0) {
      toast.error("At least one tag is required");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const post = await apiService.createPost({
        title,
        content,
        category,
        tags,
        authorId: user.id,
      });
      
      // Submit for LLM analysis
      await llmService.submitForLLMTraining(post.id);
      
      toast.success("Post created successfully");
      navigate(`/post/${post.id}`);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySuggestedTags = () => {
    if (suggestedTags.length > 0) {
      // Combine existing tags with suggested tags, remove duplicates, and limit to 5
      const combinedTags = Array.from(new Set([...tags, ...suggestedTags])).slice(0, 5);
      setTags(combinedTags);
      setSuggestedTags([]);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                category === "QA"
                  ? "Describe your question in detail..."
                  : "Share your knowledge, tutorial, or resource..."
              }
              className="min-h-[200px]"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tags">Tags (up to 5)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuggestTags}
                disabled={isSuggestingTags || content.length < 50}
              >
                {isSuggestingTags ? "Suggesting..." : "Suggest Tags"}
              </Button>
            </div>
            
            <TagInput
              value={tags}
              onChange={handleTagsChange}
              placeholder="Add tags..."
              maxTags={5}
            />
            
            {suggestedTags.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Suggested tags:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (tags.length < 5 && !tags.includes(tag)) {
                          setTags([...tags, tag]);
                        }
                      }}
                      disabled={tags.includes(tag) || tags.length >= 5}
                    >
                      {tag}
                    </Button>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={applySuggestedTags}
                  >
                    Apply All
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !title.trim() ||
                !content.trim() ||
                tags.length === 0
              }
            >
              {isSubmitting ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
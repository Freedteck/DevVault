import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Post } from "@/types";
import { PostDetail as PostDetailComponent } from "@/components/posts/post-detail";
import { CommentList } from "@/components/posts/comment-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import apiService from "@/services/api-service";
import { toast } from "sonner";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
    }
  }, [postId]);

  const fetchPost = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedPost = await apiService.getPost(id);
      
      if (!fetchedPost) {
        setError("Post not found");
        return;
      }
      
      setPost(fetchedPost);
      
      // Increment view count (in a real app, this would be an API call)
      if (fetchedPost) {
        const updatedPost = await apiService.updatePost(id, {
          viewCount: fetchedPost.viewCount + 1,
        });
        setPost(updatedPost);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Failed to load post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (direction: "up" | "down") => {
    if (!post) return;
    
    try {
      const updatedPost = await apiService.updatePost(post.id, {
        votes: direction === "up" ? post.votes + 1 : Math.max(0, post.votes - 1),
      });
      
      setPost(updatedPost);
      
      if (direction === "up") {
        toast.success("Upvoted successfully");
      } else {
        toast.success("Downvoted successfully");
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to register vote");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-medium mb-4">
            {error || "Post not found"}
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        ← Back
      </Button>
      
      <PostDetailComponent post={post} onVote={handleVote} />
      
      <Separator className="my-8" />
      
      <CommentList post={post} />
    </div>
  );
}
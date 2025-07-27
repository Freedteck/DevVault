import { useState, useEffect } from "react";
import { Comment, Post } from "@/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TipDialog } from "@/components/shared/tip-dialog";
import { useAuth } from "@/context/auth-context";
import apiService from "@/services/api-service";
import { format } from "date-fns";
import { TOKEN_SYMBOL } from "@/lib/constants";
import { toast } from "sonner";

interface CommentListProps {
  post: Post;
}

export function CommentList({ post }: CommentListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipDialogData, setTipDialogData] = useState<{
    isOpen: boolean;
    comment?: Comment;
  }>({
    isOpen: false,
  });

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const postComments = await apiService.getComments(post.id);
      setComments(postComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const comment = await apiService.addComment({
        content: newComment,
        authorId: user.id,
        postId: post.id,
      });
      
      setComments([...comments, comment]);
      setNewComment("");
      toast.success("Comment posted successfully");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTipDialog = (comment: Comment) => {
    setTipDialogData({
      isOpen: true,
      comment,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">
        Comments ({post.commentCount})
      </h2>
      
      {user && (
        <form onSubmit={handleCommentSubmit} className="space-y-4">
          <Textarea
            placeholder="Add your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      )}
      
      {!user && (
        <Card className="p-4 bg-muted/50 text-center">
          <p>You need to log in to post comments.</p>
        </Card>
      )}
      
      <Separator className="my-6" />
      
      {isLoading ? (
        <div className="text-center py-8">Loading comments...</div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex justify-between mb-2">
                <div className="flex items-start space-x-2">
                  <UserAvatar user={comment.author} showName />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {comment.tipAmount > 0 && (
                    <div className="text-sm flex items-center">
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
                        className="h-4 w-4 mr-1"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                        <path d="M12 18V6" />
                      </svg>
                      <span>
                        {comment.tipAmount} {TOKEN_SYMBOL}
                      </span>
                    </div>
                  )}
                  
                  {user && user.id !== comment.authorId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTipDialog(comment)}
                    >
                      Tip
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="mt-2 whitespace-pre-line">{comment.content}</div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      )}
      
      {tipDialogData.comment && (
        <TipDialog
          isOpen={tipDialogData.isOpen}
          onClose={() => setTipDialogData({ isOpen: false })}
          recipient={tipDialogData.comment.author}
          postId={post.id}
          commentId={tipDialogData.comment.id}
        />
      )}
    </div>
  );
}
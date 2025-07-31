import { useState, useEffect, useContext } from "react";
import { Comment } from "@/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TipDialog } from "@/components/shared/tip-dialog";
import { format } from "date-fns";
import { TOKEN_SYMBOL } from "@/lib/constants";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { RichTextContent } from "@/components/shared/rich-text-content";
import { userWalletContext } from "@/context/userWalletContext";
import { contentData } from "@/context/ContentData";

const COMMENT_TOPIC_ID = import.meta.env.VITE_COMMENT_TOPIC_ID;
interface CommentListProps {
  post: any;
}

export function CommentList({ post }: CommentListProps) {
  const { userProfile, isLoading } = useContext(userWalletContext);
  const { uploadContent } = useContext(contentData);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipDialogData, setTipDialogData] = useState<{
    isOpen: boolean;
    comment?: any;
  }>({
    isOpen: false,
  });

  const comments = post.comments || [];

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      toast.error("You must be logged in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const toastId = toast.loading("Posting comment...");
    try {
      setIsSubmitting(true);

      const comment = {
        id: Date.now().toString(),
        content: newComment,
        author: userProfile,
        postId: post.data.id,
        createdAt: new Date().toISOString(),
        contentId: post.data.id,
      };

      await uploadContent(comment, COMMENT_TOPIC_ID);
      setNewComment("");
      toast.success("Comment posted successfully", { id: toastId });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment", { id: toastId });
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
      <h2 className="text-xl font-bold">Comments ({post.comments.length})</h2>

      {userProfile && (
        <form onSubmit={handleCommentSubmit} className="space-y-4">
          <RichTextEditor
            placeholder="Add your comment..."
            value={newComment}
            onChange={setNewComment}
            minHeight="150px"
          />
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      )}

      {!userProfile && (
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
            <Card key={comment.data.id} className="p-4">
              <div className="flex justify-between mb-2">
                <div className="flex items-start space-x-2">
                  <UserAvatar user={comment.data.author} showName />
                  <span className="text-sm text-muted-foreground">
                    {format(
                      new Date(comment.data.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {comment?.tipAmount > 0 && (
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
                        {comment?.tipAmount} {TOKEN_SYMBOL}
                      </span>
                    </div>
                  )}

                  {userProfile &&
                    userProfile.account_id !==
                      comment.data.author.account_id && (
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

              <div className="mt-2">
                <RichTextContent content={comment.data.content} />
              </div>
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
          recipient={tipDialogData.comment.data.author}
          postId={post.data.id}
          commentId={tipDialogData.comment.data.id}
        />
      )}
    </div>
  );
}

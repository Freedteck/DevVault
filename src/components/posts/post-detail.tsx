import { useContext, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TagBadge } from "@/components/shared/tag-badge";
import { TipDialog } from "@/components/shared/tip-dialog";
import { format } from "date-fns";
import { TOKEN_SYMBOL } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";
import llmService from "@/services/llm-service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { userWalletContext } from "@/context/userWalletContext";
import { RichTextContent } from "@/components/shared/rich-text-content";

export function PostDetail({ post, onVote, className = "" }) {
  const { userProfile } = useContext(userWalletContext);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [isSubmittingForAI, setIsSubmittingForAI] = useState(false);

  const handleVote = (direction: "up" | "down") => {
    if (!userProfile) {
      toast.error("You must be logged in to vote");
      return;
    }
    onVote(direction);
  };

  const handleSubmitForAI = async () => {
    if (!userProfile) {
      toast.error("You must be logged in to submit content for AI training");
      return;
    }

    try {
      setIsSubmittingForAI(true);
      const contribution = await llmService.submitForLLMTraining(post.id);

      if (contribution.usedForTraining) {
        toast.success("Content submitted for AI training successfully");
      } else {
        toast.info("Content quality assessed, but not selected for training");
      }
    } catch (error) {
      console.error("Error submitting for AI:", error);
      toast.error("Failed to submit content for AI training");
    } finally {
      setIsSubmittingForAI(false);
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold">{post?.data.title}</h1>
          <Badge
            variant={post?.data.category === "QA" ? "default" : "secondary"}
            className="ml-2"
          >
            {post?.data.category === "QA" ? "Q&A" : "Resource"}
          </Badge>
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <UserAvatar user={post?.data.author} showName size="md" />
          <div className="flex items-center">
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
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Posted on{" "}
              {format(
                new Date(post?.data.createdAt || "today"),
                "MMM d, yyyy 'at' h:mm a"
              )}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <RichTextContent content={post?.data.content} className="mb-4" />

        <div className="flex flex-wrap gap-2 mt-4">
          {post?.data.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="p-4 flex flex-wrap justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
            onClick={() => handleVote("up")}
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
              <path d="m19 14-7-7-7 7" />
            </svg>
            {/* <span>Upvote ({post.votes})</span> */}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
            onClick={() => handleVote("down")}
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
              <path d="m5 10 7 7 7-7" />
            </svg>
            <span>Downvote</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
            onClick={() => handleSubmitForAI()}
            disabled={isSubmittingForAI || !userProfile}
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>
              {isSubmittingForAI ? "Analyzing..." : "Submit for AI Training"}
            </span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="flex items-center space-x-1"
            onClick={() => setShowTipDialog(true)}
            disabled={
              !userProfile ||
              (userProfile &&
                userProfile.account_id === post?.data.author.account_id)
            }
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
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
              <path d="M12 18V6" />
            </svg>
            <span>
              Tip ({""} {TOKEN_SYMBOL})
            </span>
          </Button>
        </div>
      </CardFooter>

      {showTipDialog && (
        <TipDialog
          isOpen={showTipDialog}
          onClose={() => setShowTipDialog(false)}
          recipient={post.data.author}
          postId={post.data.id}
        />
      )}
    </Card>
  );
}

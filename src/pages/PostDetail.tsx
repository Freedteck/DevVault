import { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PostDetail as PostDetailComponent } from "@/components/posts/post-detail";
import { CommentList } from "@/components/posts/comment-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { contentData } from "@/context/ContentData";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { contents, isLoading } = useContext(contentData);
  const post = contents.find((content) => content.data.id === postId);

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

  if (!post) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-medium mb-4">{"Post not found"}</h2>
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
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        ← Back
      </Button>

      <PostDetailComponent post={post} onVote={() => console.log("Vote!")} />

      <Separator className="my-8" />

      <CommentList post={post} />
    </div>
  );
}

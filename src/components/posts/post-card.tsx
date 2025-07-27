import { Link } from "react-router-dom";
import { Post } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TagBadge } from "@/components/shared/tag-badge";
import { format } from "date-fns";
import { TOKEN_SYMBOL } from "@/lib/constants";

interface PostCardProps {
  post: Post;
  showFullContent?: boolean;
}

export function PostCard({ post, showFullContent = false }: PostCardProps) {
  const contentPreview = showFullContent 
    ? post.content 
    : post.content.length > 200 
      ? `${post.content.substring(0, 200)}...` 
      : post.content;
      
  const postUrl = `/post/${post.id}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <Link to={postUrl} className="text-lg font-medium hover:underline">
            {post.title}
          </Link>
          <Badge variant={post.category === "QA" ? "default" : "secondary"}>
            {post.category === "QA" ? "Q&A" : "Resource"}
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserAvatar user={post.author} size="sm" />
              <span>Posted on {format(new Date(post.createdAt), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
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
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{post.viewCount}</span>
              </div>
              <div className="flex items-center space-x-1">
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
                  <path d="M7 10v12" />
                  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                </svg>
                <span>{post.votes}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none mb-4">
          <p>{contentPreview}</p>
          {!showFullContent && post.content.length > 200 && (
            <Link to={postUrl} className="text-primary hover:underline">
              Read more
            </Link>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-sm">
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{post.commentCount} comments</span>
          </div>
          <div className="flex items-center space-x-1 text-sm">
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
            <span>{post.tipAmount} {TOKEN_SYMBOL}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
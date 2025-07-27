import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  tag: string;
  count?: number;
  className?: string;
}

export function TagBadge({ tag, count, className = "" }: TagBadgeProps) {
  return (
    <Link to={`/tags/${tag}`}>
      <Badge
        variant="secondary"
        className={`cursor-pointer hover:bg-secondary/80 ${className}`}
      >
        {tag}
        {count !== undefined && (
          <span className="ml-1 text-xs text-muted-foreground">×{count}</span>
        )}
      </Badge>
    </Link>
  );
}
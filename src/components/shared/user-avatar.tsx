import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types";

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

export function UserAvatar({
  user,
  size = "md",
  showName = false,
  className = "",
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Link
      to={`/profile/${user.id}`}
      className={`flex items-center space-x-2 ${className}`}
    >
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user.avatarUrl} alt={user.displayName} />
        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
      </Avatar>
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none">
            {user.displayName}
          </span>
          <span className="text-xs text-muted-foreground">@{user.username}</span>
        </div>
      )}
    </Link>
  );
}
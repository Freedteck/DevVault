import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TOKEN_SYMBOL } from "@/lib/constants";
import { userWalletContext } from "@/context/userWalletContext";
import { useWalletInterface } from "@/hooks/useWalletInterface";
import { Button } from "../ui/button";

interface UserMenuProps {
  user: any;
}

export function UserMenu({ user }: UserMenuProps) {
  const { disconnect } = useWalletInterface();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    disconnect();
    setIsOpen(false);
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-2">
          {/* <Avatar className="h-8 w-8">
            <AvatarImage src={user} alt={user} />
            <AvatarFallback>{getInitials(user)}</AvatarFallback>
          </Avatar> */}
          <Button
            variant="secondary"
            className="hidden text-sm font-medium md:inline-block"
          >
            {user}
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.displayName}</span>
            <span className="text-xs text-muted-foreground">@{user}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div className="flex justify-between">
            <span>Balance</span>
            <span className="font-medium">
              {1000} {TOKEN_SYMBOL}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" onClick={() => setIsOpen(false)}>
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard" onClick={() => setIsOpen(false)}>
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wallet" onClick={() => setIsOpen(false)}>
            Wallet
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" onClick={() => setIsOpen(false)}>
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

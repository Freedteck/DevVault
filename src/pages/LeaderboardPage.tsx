import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TOKEN_SYMBOL } from "@/lib/constants";
import apiService from "@/services/api-service";
import { toast } from "sonner";
import { contentData } from "@/context/ContentData";
import { MirrorNodeClient } from "@/services/mirrorNodeClient";

const COMMENT_TOPIC_ID = import.meta.env.VITE_COMMENT_TOPIC_ID || "";
export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const { contents, isLoading: loading } = useContext(contentData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { getTopicMessages } = await MirrorNodeClient();
      const { messages: comments } = await getTopicMessages(COMMENT_TOPIC_ID);
      const combinedContribution = [...contents, ...comments];
      const leaderboardUsers = [];
      for (const content of combinedContribution) {
        const { getTokenBalance } = await MirrorNodeClient();
        const tokenBalance = await getTokenBalance(
          content.data.author.account_id
        );

        leaderboardUsers.push({
          ...content,
          tokens: tokenBalance,
        });
      }

      const uniqueUsers = new Map();

      leaderboardUsers.forEach((user) => {
        if (!uniqueUsers.has(user.data.author.account_id)) {
          uniqueUsers.set(user.data.author.account_id, {
            ...user,
            contributions: 0,
          });
        }
        uniqueUsers.get(user.data.author.account_id).contributions += 1;
      });

      setUsers(uniqueUsers.size > 0 ? Array.from(uniqueUsers.values()) : []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">
            Top contributors based on tokens earned through tips and
            contributions
          </p>
        </div>
        <Link to="/about/dvt">
          <Button variant="outline" className="shrink-0">
            Learn About {TOKEN_SYMBOL}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent mb-4"></div>
                <p>Loading leaderboard...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {users?.map((user, index) => (
                <div
                  key={user?.data.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/10"
                      : index === 1
                      ? "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/20 dark:to-gray-700/10"
                      : index === 2
                      ? "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-white ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                          ? "bg-gray-500"
                          : index === 2
                          ? "bg-amber-600"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <UserAvatar user={user?.data} showName size="md" />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center font-medium">
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
                        className="h-4 w-4 mr-1 text-primary"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                        <path d="M12 18V6" />
                      </svg>
                      <span>
                        {user.tokens} {TOKEN_SYMBOL}
                      </span>
                    </div>
                    <Link to={`/profile/${user.data.author.account_id}`}>
                      <Button variant="ghost" size="sm">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <h2 className="text-xl font-semibold mb-4">How to Earn Tokens</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-primary mb-4"
                >
                  <polygon points="14 2 18 6 7 17 3 17 3 13 14 2" />
                  <line x1="3" y1="22" x2="21" y2="22" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Create Content</h3>
                <p className="text-muted-foreground text-sm">
                  Share valuable resources or answer questions to help others.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-primary mb-4"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">
                  Contribute Data for AI
                </h3>
                <p className="text-muted-foreground text-sm">
                  Submit high-quality content for AI training and earn tokens.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-primary mb-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                  <path d="M12 18V6" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Receive Tips</h3>
                <p className="text-muted-foreground text-sm">
                  Get tipped by other users who find your contributions
                  valuable.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

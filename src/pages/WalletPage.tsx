import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Transaction } from "@/types";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TOKEN_NAME, TOKEN_SYMBOL } from "@/lib/constants";
import apiService from "@/services/api-service";
import { toast } from "sonner";
import { format } from "date-fns";
import { userWalletContext } from "@/context/userWalletContext";

export default function WalletPage() {
  const navigate = useNavigate();
  const { user, connectWallet } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useContext(userWalletContext);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, navigate]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);

      if (!user) return;

      const userTransactions = await apiService.getUserTransactions(user.id);
      setTransactions(userTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load wallet transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const success = await connectWallet();

      if (success) {
        toast.success("Wallet connected successfully");
      } else {
        toast.error("Failed to connect wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    }
  };

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-medium mb-4">User not found</h2>
          <p className="text-center text-muted-foreground mb-6">
            This account must be a registered user to access this page.
          </p>
          <div className="flex item-center gap-4">
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline">Register</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredTransactions = transactions.filter((tx) => {
    switch (activeTab) {
      case "received":
        return tx.toUserId === user.id;
      case "sent":
        return tx.fromUserId === user.id;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{TOKEN_NAME} Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-4">
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
                    className="h-6 w-6"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                    <path d="M12 18V6" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {user.tokens} {TOKEN_SYMBOL}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available balance
                  </div>
                </div>
              </div>

              <div>
                <Button size="sm">Withdraw</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Hedera Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            {user.walletAddress ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white mr-4">
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
                      className="h-6 w-6"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-md font-medium font-mono">
                      {user.walletAddress}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Connected wallet
                    </div>
                  </div>
                </div>

                <div>
                  <Button size="sm" variant="outline">
                    View on Explorer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-center text-muted-foreground mb-4">
                  Connect your Hedera wallet to receive tips and rewards
                </p>
                <Button onClick={handleConnectWallet}>Connect Wallet</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-4"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent mb-4"></div>
                <p>Loading transactions...</p>
              </div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-full ${
                        tx.toUserId === user.id
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {tx.toUserId === user.id ? (
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
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      ) : (
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
                          <path d="m6 15 6-6 6 6" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="font-medium">
                        {tx.toUserId === user.id ? "Received" : "Sent"}{" "}
                        {tx.type === "TIP" ? "Tip" : "Transfer"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(
                          new Date(tx.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div
                        className={`font-medium ${
                          tx.toUserId === user.id
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {tx.toUserId === user.id ? "+" : "-"}
                        {tx.amount} {TOKEN_SYMBOL}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Badge
                          variant={
                            tx.status === "COMPLETED" ? "outline" : "secondary"
                          }
                          className="text-xs"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">
                No transactions found
              </p>
              <p className="text-sm text-muted-foreground">
                {activeTab === "sent"
                  ? "You haven't sent any tokens yet"
                  : activeTab === "received"
                  ? "You haven't received any tokens yet"
                  : "Your transaction history will appear here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to Earn Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>How to Earn {TOKEN_SYMBOL}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
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

            <div className="flex flex-col items-center text-center p-4">
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

            <div className="flex flex-col items-center text-center p-4">
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
                Get tipped by other users who find your contributions valuable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

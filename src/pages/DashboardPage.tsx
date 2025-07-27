import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart } from 'recharts';

// Mock data - in a real app, this would come from an API
const activityData = [
  { name: 'Jan', posts: 4, comments: 6, tips: 2 },
  { name: 'Feb', posts: 3, comments: 8, tips: 5 },
  { name: 'Mar', posts: 2, comments: 10, tips: 8 },
  { name: 'Apr', posts: 5, comments: 12, tips: 6 },
  { name: 'May', posts: 6, comments: 9, tips: 9 },
  { name: 'Jun', posts: 8, comments: 15, tips: 12 },
];

const tokenData = [
  { name: 'Jan', earned: 45, spent: 20 },
  { name: 'Feb', earned: 55, spent: 30 },
  { name: 'Mar', earned: 75, spent: 40 },
  { name: 'Apr', earned: 85, spent: 35 },
  { name: 'May', earned: 105, spent: 50 },
  { name: 'Jun', earned: 120, spent: 60 },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            View your stats, activity, and token balance
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Posts
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 8v8m-8-8v8M4 6h16M6 6h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6Z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              +14% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Comments
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">60</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">420</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reputation Score
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
              <circle cx="17" cy="7" r="5" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">
              +9% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="tokens">Token History</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>
                Your activity over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="posts" fill="#8884d8" name="Posts" />
                  <Bar dataKey="comments" fill="#82ca9d" name="Comments" />
                  <Bar dataKey="tips" fill="#ffc658" name="Tips Received" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Token History</CardTitle>
              <CardDescription>
                Your token activity over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={tokenData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="earned" stroke="#8884d8" name="Tokens Earned" />
                  <Line type="monotone" dataKey="spent" stroke="#82ca9d" name="Tokens Spent" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent platform activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="rounded-full bg-primary/10 p-2">
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
                  className="h-4 w-4 text-primary"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Posted "Understanding React Hooks"</p>
                <p className="text-sm text-muted-foreground">2 days ago</p>
              </div>
              <div className="text-sm font-medium text-primary">+35 tokens</div>
            </div>
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="rounded-full bg-primary/10 p-2">
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
                  className="h-4 w-4 text-primary"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Commented on "GraphQL Best Practices"</p>
                <p className="text-sm text-muted-foreground">4 days ago</p>
              </div>
              <div className="text-sm font-medium text-primary">+10 tokens</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2">
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
                  className="h-4 w-4 text-primary"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Tipped user johnsmith for "Database Optimization"</p>
                <p className="text-sm text-muted-foreground">1 week ago</p>
              </div>
              <div className="text-sm font-medium text-destructive">-20 tokens</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
            <CardDescription>Your most used tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="font-medium">JavaScript</div>
                <div className="ml-auto text-sm text-muted-foreground">42 posts</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-medium">React</div>
                <div className="ml-auto text-sm text-muted-foreground">38 posts</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-medium">TypeScript</div>
                <div className="ml-auto text-sm text-muted-foreground">31 posts</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-medium">Node.js</div>
                <div className="ml-auto text-sm text-muted-foreground">24 posts</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-medium">Web3</div>
                <div className="ml-auto text-sm text-muted-foreground">19 posts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
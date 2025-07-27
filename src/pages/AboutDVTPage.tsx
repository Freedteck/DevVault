import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TOKEN_NAME, TOKEN_SYMBOL, NETWORK_NAME } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock token data - would come from API in real app
const tokenData = [
  { month: 'Jan', price: 0.10, volume: 125000 },
  { month: 'Feb', price: 0.12, volume: 150000 },
  { month: 'Mar', price: 0.14, volume: 180000 },
  { month: 'Apr', price: 0.15, volume: 210000 },
  { month: 'May', price: 0.18, volume: 250000 },
  { month: 'Jun', price: 0.22, volume: 300000 },
  { month: 'Jul', price: 0.25, volume: 350000 },
];

export default function AboutDVTPage() {
  return (
    <div className="container mx-auto py-6 space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">About {TOKEN_NAME} ({TOKEN_SYMBOL})</h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
          The native token powering the DevVault ecosystem, enabling a transparent and fair knowledge economy.
        </p>
      </section>

      <Separator />

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-4">{TOKEN_NAME} Overview</h2>
          <p className="text-lg text-muted-foreground">
            {TOKEN_NAME} ({TOKEN_SYMBOL}) is the native token of the DevVault platform. Built on the {NETWORK_NAME} network, 
            it enables a transparent and efficient knowledge economy where developers can be directly rewarded for their contributions.
          </p>
          <p className="text-lg text-muted-foreground mt-4">
            Whether answering questions, sharing resources, or contributing to community projects, {TOKEN_SYMBOL} provides 
            a direct way to recognize and reward valuable contributions.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
            <CardDescription>Technical specifications of {TOKEN_SYMBOL}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Token Name:</span>
                <span>{TOKEN_NAME}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Token Symbol:</span>
                <span>{TOKEN_SYMBOL}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Blockchain:</span>
                <span>{NETWORK_NAME}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Supply:</span>
                <span>100,000,000 {TOKEN_SYMBOL}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Current Price:</span>
                <span>$0.25 USD</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Market Cap:</span>
                <span>$25,000,000 USD</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Contract Address:</span>
                <span className="text-xs sm:text-sm">0x7a2...3f9b</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Token Metrics</h2>
        
        <Tabs defaultValue="price">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="price">Price History</TabsTrigger>
            <TabsTrigger value="volume">Trading Volume</TabsTrigger>
          </TabsList>
          <TabsContent value="price" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>{TOKEN_SYMBOL} Price History</CardTitle>
                <CardDescription>Last 7 months in USD</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tokenData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" name={`${TOKEN_SYMBOL} Price (USD)`} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="volume" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>{TOKEN_SYMBOL} Trading Volume</CardTitle>
                <CardDescription>Last 7 months volume in tokens</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tokenData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="volume" stroke="#82ca9d" name={`${TOKEN_SYMBOL} Volume`} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Token Utility</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipping System</CardTitle>
              <CardDescription>Reward valuable contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use {TOKEN_SYMBOL} to tip other developers for helpful answers, insightful tutorials, or any 
                content you find valuable. Tips are sent directly to the content creator's wallet with minimal fees.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reputation Building</CardTitle>
              <CardDescription>Gain recognition for knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                As you earn {TOKEN_SYMBOL} through contributions, your reputation on the platform grows. High {TOKEN_SYMBOL} 
                earners appear on the leaderboard, gaining visibility and recognition in the community.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Governance</CardTitle>
              <CardDescription>Shape the future of DevVault</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {TOKEN_SYMBOL} holders can participate in platform governance decisions, including feature prioritization, 
                token economics, and community initiatives. Your stake gives you a voice in the platform's evolution.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Token Distribution</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-muted rounded-lg p-8 flex items-center justify-center">
            <div className="w-full max-w-xs">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-primary rounded-full mr-2"></span>
                      Community Rewards
                    </span>
                    <span>40%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full mt-1">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "40%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      Team & Advisors
                    </span>
                    <span>20%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full mt-1">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "20%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Reserve Fund
                    </span>
                    <span>15%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full mt-1">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      Initial Sale
                    </span>
                    <span>15%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full mt-1">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                      Development
                    </span>
                    <span>10%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full mt-1">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: "10%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Token Allocation</h3>
            <p className="text-lg text-muted-foreground mb-4">
              {TOKEN_NAME} has been designed with a distribution model that emphasizes community rewards 
              while ensuring sustainable development and platform growth.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong>Community Rewards (40%):</strong> Allocated to reward platform users for contributing content, answering questions, and participating in platform activities.</li>
              <li><strong>Team & Advisors (20%):</strong> Reserved for the founding team and advisors, with vesting periods to ensure long-term alignment.</li>
              <li><strong>Reserve Fund (15%):</strong> Maintained to ensure platform stability and for strategic partnerships.</li>
              <li><strong>Initial Sale (15%):</strong> Sold during initial token sale to bootstrap the ecosystem.</li>
              <li><strong>Development (10%):</strong> Dedicated to ongoing platform development, infrastructure, and operations.</li>
            </ul>
          </div>
        </div>
      </section>

      <Separator />

      <section className="text-center">
        <h2 className="text-3xl font-bold mb-4">Start Earning {TOKEN_SYMBOL}</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Ready to join the DevVault knowledge economy? Start contributing today and earn {TOKEN_SYMBOL}.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/signup">
            <Button size="lg">Create Account</Button>
          </Link>
          <Link to="/wallet">
            <Button size="lg" variant="outline">Learn About Wallets</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
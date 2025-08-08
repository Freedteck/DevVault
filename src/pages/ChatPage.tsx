import { EnhancedAIChat } from "@/components/chat/enhanced-ai-chat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ChatPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get help with coding questions, development problems, or learn about
          DevVault features with our new formatted responses
        </p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">
            AI Chat{" "}
            {/* <Badge variant="outline" className="ml-2 text-xs">
              Updated
            </Badge> */}
          </TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="examples">Example Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <EnhancedAIChat />
        </TabsContent>

        <TabsContent value="capabilities" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Development Support</CardTitle>
                <CardDescription>
                  Coding assistance and debugging help
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Get help with coding problems across multiple programming
                  languages and frameworks:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>Debugging assistance</li>
                  <li>Code optimization suggestions</li>
                  <li>API usage examples</li>
                  <li>Framework-specific questions</li>
                  <li>Algorithm implementation help</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Guidance</CardTitle>
                <CardDescription>DevVault platform assistance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Learn more about DevVault features and how to use them:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>Platform navigation help</li>
                  <li>Feature explanations</li>
                  <li>Token system overview</li>
                  <li>Best practices for engagement</li>
                  <li>Account management guidance</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enhanced Response Format</CardTitle>
                <CardDescription>New features in AI responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Our AI assistant now provides richer responses with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>Formatted text with headings, lists, and emphasis</li>
                  <li>Syntax-highlighted code blocks</li>
                  <li>Confidence score indicators</li>
                  <li>Sources and references with relevance metrics</li>
                  <li>Expandable content sections</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limitations</CardTitle>
                <CardDescription>
                  What the AI assistant can't do
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  Be aware of the following limitations:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>Cannot access your private account information</li>
                  <li>Cannot execute or run code on your behalf</li>
                  <li>May not have knowledge of very recent technologies</li>
                  <li>Cannot access the internet or external databases</li>
                  <li>Cannot modify platform settings or content</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Example Questions</CardTitle>
              <CardDescription>
                Try asking the AI assistant questions like these
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Development Questions</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>"How do I use React hooks?"</li>
                    <li>
                      "What's the difference between let and const in
                      JavaScript?"
                    </li>
                    <li>
                      "How can I optimize a SQL query with multiple joins?"
                    </li>
                    <li>"What are best practices for RESTful API design?"</li>
                    <li>"Can you explain how blockchain transactions work?"</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Platform Questions</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>"How does the DevVault tipping system work?"</li>
                    <li>"What are DVT tokens and how do I earn them?"</li>
                    <li>"How do I create a high-quality resource post?"</li>
                    <li>"What information should I include in my profile?"</li>
                    <li>"How is my reputation score calculated?"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

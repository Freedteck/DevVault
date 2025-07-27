import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TOKEN_SYMBOL } from "@/lib/constants";

export default function AIFeaturesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI-Powered Features</h1>
        <p className="text-muted-foreground mt-2">
          DevVault leverages AI to enhance the developer experience and provide valuable insights
        </p>
      </div>
      
      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Training the Next Generation of AI</h2>
              <p className="text-muted-foreground">
                Your high-quality contributions help train specialized AI models for software development,
                creating a virtuous cycle that benefits the entire developer community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/create">
                  <Button>Start Contributing</Button>
                </Link>
                <Link to="/about-ai">
                  <Button variant="outline">Learn More</Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="240"
                height="240"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary opacity-70"
              >
                <path d="M12 2v8" />
                <path d="m16 6-4 4-4-4" />
                <path d="M8 16h8" />
                <path d="M12 12v8" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Features Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Available AI Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Quality Analysis</CardTitle>
              <CardDescription>
                AI evaluates your content for quality and usefulness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our AI model analyzes your posts to assess their educational value, 
                code quality, and relevance to the developer community.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Evaluates code snippets for correctness</span>
                </li>
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Analyzes explanation clarity</span>
                </li>
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Rewards high-quality content with {TOKEN_SYMBOL}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Tag Suggestion</CardTitle>
              <CardDescription>
                AI suggests relevant tags based on your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our AI automatically analyzes your post content and recommends the most 
                relevant tags to improve discoverability.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Identifies technologies mentioned in content</span>
                </li>
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Recognizes programming concepts</span>
                </li>
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Improves content discoverability</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Smart Content Recommendations</CardTitle>
              <CardDescription>
                AI connects users to relevant knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our recommendation engine helps developers discover related content
                and connect with experts in specific technology domains.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Suggests related questions and resources</span>
                </li>
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Connects you with domain experts</span>
                </li>
                <li className="flex items-start space-x-2">
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
                    className="h-4 w-4 text-green-600 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>Personalizes feed based on your interests</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">How It Works</h2>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-700 dark:text-blue-400">
                  1
                </div>
                <h3 className="text-lg font-medium">Contribute Content</h3>
                <p className="text-sm text-muted-foreground">
                  Share valuable knowledge through Q&A posts and resources to help fellow developers.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-700 dark:text-blue-400">
                  2
                </div>
                <h3 className="text-lg font-medium">AI Analyzes Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI evaluates your contribution for quality, accuracy, and usefulness to the community.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-700 dark:text-blue-400">
                  3
                </div>
                <h3 className="text-lg font-medium">Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Receive {TOKEN_SYMBOL} tokens as rewards for high-quality contributions that help train AI models.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Call to Action */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-2">Start Contributing Today</h3>
            <p className="text-muted-foreground">
              Share your knowledge, help fellow developers, and earn {TOKEN_SYMBOL} tokens while improving AI for everyone.
            </p>
          </div>
          <div className="shrink-0">
            <Link to="/create">
              <Button className="w-full md:w-auto">Create Your First Post</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
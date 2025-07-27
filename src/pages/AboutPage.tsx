import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-6 space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">About {APP_NAME}</h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
          {APP_DESCRIPTION}
        </p>
      </section>

      <Separator />

      <section className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground">
            DevVault was founded with a clear mission: to create a developer ecosystem where knowledge sharing is 
            transparently and fairly rewarded. We believe that developers should be recognized and compensated for 
            their contributions to the community.
          </p>
          <p className="text-lg text-muted-foreground mt-4">
            By combining a robust Q&A platform, resource sharing capabilities, and a token-based reward system, 
            we're building the first truly decentralized developer community platform.
          </p>
        </div>
        <div className="bg-muted rounded-lg p-6 flex items-center justify-center">
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-24 w-24 mx-auto text-primary"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
              <path d="M13 5v4h4"></path>
            </svg>
            <h3 className="text-2xl font-bold mt-4">Established 2025</h3>
            <p className="text-muted-foreground">Building the future of developer collaboration</p>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Core Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Q&A Platform</CardTitle>
              <CardDescription>Ask, answer, and get rewarded</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our Q&A system allows developers to ask technical questions and receive high-quality answers. 
                Both questions and answers can be tipped with DevVault Tokens (DVT), creating an incentive 
                for providing valuable responses.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resource Sharing</CardTitle>
              <CardDescription>Share knowledge, earn tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Share tutorials, code snippets, best practices, and industry insights with the community. 
                High-quality resources attract tips from users who find them valuable, creating a passive 
                income stream for knowledgeable developers.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Token Economy</CardTitle>
              <CardDescription>Transparent value exchange</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our DevVault Token (DVT) runs on the Hedera network, ensuring fast, secure, and transparent 
                transactions. Users can earn tokens through contributions and spend them to tip others or 
                access premium features.
              </p>
              <Link to="/about/dvt">
                <Button variant="link" className="p-0 mt-2">Learn more about DVT →</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">AI Integration</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">Enhanced Developer Experience</h3>
            <p className="text-lg text-muted-foreground">
              DevVault integrates advanced AI capabilities to enhance the platform experience:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Content quality analysis for maintaining high standards</li>
              <li>Automated tag suggestions to improve content discoverability</li>
              <li>AI-powered responses to common questions</li>
              <li>Code review and improvement suggestions</li>
              <li>Personalized content recommendations</li>
            </ul>
            <Link to="/ai-features">
              <Button className="mt-6">Explore AI Features</Button>
            </Link>
          </div>
          <div className="bg-muted rounded-lg p-6">
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle>AI Assistant Demo</CardTitle>
                <CardDescription>Try asking a coding question</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8 text-center">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-12 w-12 mx-auto mb-4 text-primary"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M9 3v18" />
                    <path d="M13 7h4" />
                    <path d="M13 11h4" />
                    <path d="M13 15h4" />
                  </svg>
                  <p className="text-muted-foreground mb-4">
                    Our AI assistant can help with coding questions, debugging, and more.
                  </p>
                  <Link to="/chat">
                    <Button variant="outline">Open AI Chat</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      <section className="text-center">
        <h2 className="text-3xl font-bold mb-4">Join the Community</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Be part of the next generation of developer collaboration. Share knowledge, earn tokens, and build your reputation.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/signup">
            <Button size="lg">Sign Up Now</Button>
          </Link>
          <Link to="/resources">
            <Button size="lg" variant="outline">Browse Resources</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
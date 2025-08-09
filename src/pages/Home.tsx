import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { ContentCategory } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/posts/post-card";
import { TagBadge } from "@/components/shared/tag-badge";
import { POPULAR_TAGS, APP_DESCRIPTION } from "@/lib/constants";
import { contentData } from "@/context/ContentData";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ContentCategory>("QA");
  const { questions, resources, isLoading } = useContext(contentData);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">DevVault</h1>
            <Link to="/create">
              <Button>Create Post</Button>
            </Link>
          </div>
          <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
        </section>

        <Tabs
          defaultValue="QA"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ContentCategory)}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="QA">Q&A</TabsTrigger>
              <TabsTrigger value="RESOURCE">Resources</TabsTrigger>
            </TabsList>
            <Link to={activeTab === "QA" ? "/qa" : "/resources"}>
              <Button variant="ghost" size="sm" className="text-sm">
                View All
              </Button>
            </Link>
          </div>

          <TabsContent value="QA" className="space-y-6 mt-0">
            {isLoading ? (
              <div className="text-center py-16">Loading Q&A posts...</div>
            ) : questions.length > 0 ? (
              questions
                .slice(0, 5)
                .map((post) => <PostCard key={post.data.id} post={post} />)
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                  <p className="text-center text-muted-foreground mb-4">
                    Be the first to ask a question and start the conversation!
                  </p>
                  <Link to="/create">
                    <Button>Ask a Question</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="RESOURCE" className="space-y-6 mt-0">
            {isLoading ? (
              <div className="text-center py-16">Loading resources...</div>
            ) : resources.length > 0 ? (
              resources
                .slice(0, 5)
                .map((post) => <PostCard key={post.data.id} post={post} />)
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <h3 className="text-lg font-medium mb-2">No resources yet</h3>
                  <p className="text-center text-muted-foreground mb-4">
                    Be the first to share a valuable resource with the
                    community!
                  </p>
                  <Link to="/create">
                    <Button>Share a Resource</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* About Card */}
        <Card>
          <CardHeader>
            <CardTitle>About DevVault</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              DevVault is a next-generation developer platform designed to
              reward knowledge sharing and foster collaboration. Earn tokens by
              contributing to the community!
            </p>
            <div className="flex flex-col space-y-2">
              <Link to="/about">
                <Button variant="outline" size="sm" className="w-full">
                  Learn More
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" size="sm" className="w-full">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Popular Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Tags</CardTitle>
            <CardDescription>Explore content by topic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Features */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardTitle className="flex items-center space-x-2">
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
                className="text-blue-600"
              >
                <path d="M12 2v8" />
                <path d="m16 6-4 4-4-4" />
                <path d="M8 16h8" />
                <path d="M12 12v8" />
              </svg>
              <span>AI-Powered Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
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
                <span>Contribute to AI training with your knowledge</span>
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
                <span>Get AI-suggested tags for your posts</span>
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
                <span>Discover related content through AI recommendations</span>
              </li>
            </ul>
            <Link to="/ai-features" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Learn About AI Features
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

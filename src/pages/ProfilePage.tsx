import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { User, Post } from "@/types";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/posts/post-card";
import { TOKEN_SYMBOL } from "@/lib/constants";
import apiService from "@/services/api-service";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);

  // If no userId is provided, use the current logged-in user
  const profileId = userId || currentUser?.id;
  const isOwnProfile = currentUser && profileId === currentUser.id;

  useEffect(() => {
    if (profileId) {
      fetchProfile(profileId);
    }
  }, [profileId]);

  const fetchProfile = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Fetch user profile
      const fetchedUser = await apiService.getUser(id);
      
      if (!fetchedUser) {
        toast.error("User not found");
        return;
      }
      
      setUser(fetchedUser);
      
      // Fetch user's posts
      const allPosts = await apiService.getPosts(undefined, undefined, fetchedUser.username);
      setPosts(allPosts);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-medium mb-4">User not found</h2>
          <p className="text-center text-muted-foreground mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              <AvatarFallback className="text-lg">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold">{user.displayName}</h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                
                {isOwnProfile ? (
                  <Link to="/settings/profile">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline">Follow</Button>
                    <Link to={`/messages/${user.id}`}>
                      <Button variant="outline">Message</Button>
                    </Link>
                  </div>
                )}
              </div>
              
              {user.bio && <p className="text-sm">{user.bio}</p>}
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
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
                    className="h-4 w-4 mr-1"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                    <path d="M12 18V6" />
                  </svg>
                  <span>
                    {user.tokens} {TOKEN_SYMBOL}
                  </span>
                </div>
                
                <div className="flex items-center">
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
                    className="h-4 w-4 mr-1"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>
                    Joined {format(new Date(user.createdAt), "MMM yyyy")}
                  </span>
                </div>
                
                {user.walletAddress && (
                  <div className="flex items-center">
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
                      className="h-4 w-4 mr-1"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                    <span className="font-mono text-xs">
                      {user.walletAddress.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Profile Content */}
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-6 mt-6">
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-center text-muted-foreground mb-4">
                  {isOwnProfile
                    ? "You haven't created any posts yet."
                    : `${user.displayName} hasn't created any posts yet.`}
                </p>
                {isOwnProfile && (
                  <Link to="/create">
                    <Button>Create Post</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="qa" className="space-y-6 mt-6">
          {posts.filter((p) => p.category === "QA").length > 0 ? (
            posts
              .filter((p) => p.category === "QA")
              .map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <h3 className="text-lg font-medium mb-2">No Q&A posts yet</h3>
                <p className="text-center text-muted-foreground mb-4">
                  {isOwnProfile
                    ? "You haven't asked any questions yet."
                    : `${user.displayName} hasn't asked any questions yet.`}
                </p>
                {isOwnProfile && (
                  <Link to="/create">
                    <Button>Ask a Question</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-6 mt-6">
          {posts.filter((p) => p.category === "RESOURCE").length > 0 ? (
            posts
              .filter((p) => p.category === "RESOURCE")
              .map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <h3 className="text-lg font-medium mb-2">No resources yet</h3>
                <p className="text-center text-muted-foreground mb-4">
                  {isOwnProfile
                    ? "You haven't shared any resources yet."
                    : `${user.displayName} hasn't shared any resources yet.`}
                </p>
                {isOwnProfile && (
                  <Link to="/create">
                    <Button>Share a Resource</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
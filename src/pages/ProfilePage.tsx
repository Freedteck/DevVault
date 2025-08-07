import { useState, useContext, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/posts/post-card";
import { TOKEN_SYMBOL } from "@/lib/constants";
import { format } from "date-fns";
import { userWalletContext } from "@/context/userWalletContext";
import { contentData } from "@/context/ContentData";
import { getProfile } from "@/lib/supabase";
import { MirrorNodeClient } from "@/services/mirrorNodeClient";
import { AccountId } from "@hashgraph/sdk";
import { TokenAssociationNotice } from "@/components/ui/token-association-notice";

export default function ProfilePage() {
  const { userId } = useParams();
  const {
    userProfile: profile,
    isLoading: loading,
    accountId,
  } = useContext(userWalletContext);
  const { contents } = useContext(contentData);
  const [activeTab, setActiveTab] = useState("posts");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const { success, data } = await getProfile(userId.toString());
      const { getTokenBalance } = await MirrorNodeClient();
      const tokenBalance = await getTokenBalance(userId as any as AccountId);
      if (success) {
        setUserProfile({ ...data, tokenBalance });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // If no userId is provided, use the current logged-in user
  const profileId = userId || userProfile?.account_id;
  const isOwnProfile = userProfile && profileId === accountId;

  const posts = contents.filter(
    (post) => post.data.author.account_id === profileId
  );

  useEffect(() => {
    if (userId) {
      getUserProfile();
    } else {
      setUserProfile(profile);
    }
  }, [userId, profile, getUserProfile]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileId || !userProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-medium mb-4">User not found</h2>
          <p className="text-center text-muted-foreground mb-6">
            The user you're looking for doesn't exist or has been removed.
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

  return (
    <div className="space-y-8">
      <TokenAssociationNotice/>
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={userProfile?.profile_image_url}
                alt={userProfile?.full_name}
              />
              <AvatarFallback className="text-lg">
                {getInitials(userProfile?.full_name || "User")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold">
                    {userProfile?.full_name}
                  </h1>
                  <p className="text-muted-foreground">
                    @{userProfile?.account_id}
                  </p>
                </div>

                {isOwnProfile ? (
                  <Link to="/settings/profile">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline">Follow</Button>
                    <Link to={`/messages/${userProfile?.account_id}`}>
                      <Button variant="outline">Message</Button>
                    </Link>
                  </div>
                )}
              </div>

              {userProfile?.bio && (
                <p className="text-sm">{userProfile?.bio}</p>
              )}

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
                    {userProfile?.tokenBalance} {TOKEN_SYMBOL}
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
                    Joined{" "}
                    {format(new Date(userProfile?.created_at || 0), "MMM yyyy")}
                  </span>
                </div>

                {userProfile?.account_id && (
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
                      {userProfile?.account_id}
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
            posts.map((post) => <PostCard key={post.data.id} post={post} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-center text-muted-foreground mb-4">
                  {isOwnProfile
                    ? "You haven't created any posts yet."
                    : `${userProfile?.full_name} hasn't created any posts yet.`}
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
          {posts.filter((p) => p.data.category === "QA").length > 0 ? (
            posts
              .filter((p) => p.data.category === "QA")
              .map((post) => <PostCard key={post.data.id} post={post} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <h3 className="text-lg font-medium mb-2">No Q&A posts yet</h3>
                <p className="text-center text-muted-foreground mb-4">
                  {isOwnProfile
                    ? "You haven't asked any questions yet."
                    : `${userProfile?.full_name} hasn't asked any questions yet.`}
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
          {posts.filter((p) => p.data.category === "RESOURCE").length > 0 ? (
            posts
              .filter((p) => p.data.category === "RESOURCE")
              .map((post) => <PostCard key={post.data.id} post={post} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <h3 className="text-lg font-medium mb-2">No resources yet</h3>
                <p className="text-center text-muted-foreground mb-4">
                  {isOwnProfile
                    ? "You haven't shared any resources yet."
                    : `${userProfile?.full_name} hasn't shared any resources yet.`}
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

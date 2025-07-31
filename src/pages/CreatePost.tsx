import { CreatePostForm } from "@/components/posts/create-post-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { userWalletContext } from "@/context/userWalletContext";
import { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function CreatePost() {
  const navigate = useNavigate();
  const { userProfile } = useContext(userWalletContext);

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-medium mb-4">User not found</h2>
          <p className="text-center text-muted-foreground mb-6">
            You must be a registered user to create a post
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create Post</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      <p className="text-muted-foreground">
        Share your knowledge or ask a question to the community. Quality content
        might earn you tips from other developers!
      </p>

      <CreatePostForm />
    </div>
  );
}

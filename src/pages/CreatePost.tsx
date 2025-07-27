import { CreatePostForm } from "@/components/posts/create-post-form";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create Post</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        Share your knowledge or ask a question to the community. Quality content might earn you tips from other developers!
      </p>
      
      <CreatePostForm />
    </div>
  );
}
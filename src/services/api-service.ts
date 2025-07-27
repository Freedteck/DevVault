import { User, Post, Comment, Tag, Notification, Transaction, ContentCategory, LLMContribution } from "@/types";

// Mock data for development
const mockUsers: User[] = [
  {
    id: "user-1",
    username: "dev_alice",
    displayName: "Alice Developer",
    avatarUrl: "https://api.dicebear.com/6.x/avataaars/svg?seed=Alice",
    bio: "Full-stack developer with passion for blockchain",
    walletAddress: "0.0.12345",
    tokens: 500,
    createdAt: new Date(Date.now() - 7000000000),
  },
  {
    id: "user-2",
    username: "bob_coder",
    displayName: "Bob Coder",
    avatarUrl: "https://api.dicebear.com/6.x/avataaars/svg?seed=Bob",
    bio: "Backend developer & blockchain enthusiast",
    walletAddress: "0.0.67890",
    tokens: 350,
    createdAt: new Date(Date.now() - 5000000000),
  },
  {
    id: "user-3",
    username: "crypto_carol",
    displayName: "Carol Blockchain",
    avatarUrl: "https://api.dicebear.com/6.x/avataaars/svg?seed=Carol",
    bio: "DApp architect & Hedera specialist",
    walletAddress: "0.0.24680",
    tokens: 800,
    createdAt: new Date(Date.now() - 3000000000),
  },
];

const mockTags: Tag[] = [
  { id: "tag-1", name: "javascript", count: 124, description: "JavaScript programming language" },
  { id: "tag-2", name: "react", count: 98, description: "React frontend framework" },
  { id: "tag-3", name: "blockchain", count: 56, description: "Blockchain technology" },
  { id: "tag-4", name: "hedera", count: 43, description: "Hedera Hashgraph platform" },
  { id: "tag-5", name: "typescript", count: 87, description: "TypeScript language" },
  { id: "tag-6", name: "node.js", count: 65, description: "Node.js runtime" },
];

const mockPosts: Post[] = [
  {
    id: "post-1",
    title: "How to optimize React component rendering?",
    content: "I've been working on a complex React application and noticed some performance issues. What are the best practices for optimizing React component rendering? I've tried using React.memo but I'm not seeing significant improvements.",
    authorId: "user-1",
    author: mockUsers[0],
    category: "QA",
    tags: ["react", "javascript", "performance"],
    tipAmount: 75,
    votes: 12,
    viewCount: 245,
    createdAt: new Date(Date.now() - 2500000000),
    updatedAt: new Date(Date.now() - 2500000000),
    commentCount: 3,
  },
  {
    id: "post-2",
    title: "Introduction to Hedera Token Service",
    content: "Hedera Token Service (HTS) provides the ability to issue and configure tokens on Hedera's public network. This resource explains key concepts and provides code examples for creating and managing tokens with HTS.",
    authorId: "user-3",
    author: mockUsers[2],
    category: "RESOURCE",
    tags: ["hedera", "blockchain", "tokenization"],
    tipAmount: 130,
    votes: 28,
    viewCount: 512,
    createdAt: new Date(Date.now() - 1500000000),
    updatedAt: new Date(Date.now() - 1000000000),
    commentCount: 5,
  },
  {
    id: "post-3",
    title: "TypeScript best practices in 2025",
    content: "This resource covers the latest TypeScript best practices for 2025. Learn about the newest features and how to structure your TypeScript projects for maximum type safety and developer experience.",
    authorId: "user-2",
    author: mockUsers[1],
    category: "RESOURCE",
    tags: ["typescript", "javascript", "best-practices"],
    tipAmount: 95,
    votes: 18,
    viewCount: 320,
    createdAt: new Date(Date.now() - 900000000),
    updatedAt: new Date(Date.now() - 800000000),
    commentCount: 4,
  },
  {
    id: "post-4",
    title: "How to integrate Hedera Consensus Service in Node.js?",
    content: "I'm trying to implement a decentralized messaging system using Hedera Consensus Service with Node.js. I've read the documentation but still struggling with the implementation. Can anyone provide a step-by-step guide or sample code?",
    authorId: "user-2",
    author: mockUsers[1],
    category: "QA",
    tags: ["hedera", "node.js", "consensus"],
    tipAmount: 45,
    votes: 7,
    viewCount: 189,
    createdAt: new Date(Date.now() - 500000000),
    updatedAt: new Date(Date.now() - 500000000),
    commentCount: 2,
  },
];

const mockComments: Comment[] = [
  {
    id: "comment-1",
    content: "Have you tried using the React Profiler tool to identify bottlenecks? It's a great way to start optimizing your components.",
    authorId: "user-2",
    author: mockUsers[1],
    postId: "post-1",
    tipAmount: 15,
    createdAt: new Date(Date.now() - 2400000000),
    updatedAt: new Date(Date.now() - 2400000000),
  },
  {
    id: "comment-2",
    content: "React.memo is great, but you should also look into useMemo and useCallback hooks for more fine-grained optimization. Also, be sure you're not creating new objects in your render function.",
    authorId: "user-3",
    author: mockUsers[2],
    postId: "post-1",
    tipAmount: 25,
    createdAt: new Date(Date.now() - 2300000000),
    updatedAt: new Date(Date.now() - 2300000000),
  },
];

const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    userId: "user-1",
    type: "TIP",
    message: "Bob Coder tipped you 15 tokens for your answer",
    read: false,
    relatedPostId: "post-1",
    createdAt: new Date(Date.now() - 100000000),
  },
  {
    id: "notif-2",
    userId: "user-1",
    type: "COMMENT",
    message: "Carol Blockchain commented on your question about React optimization",
    read: true,
    relatedPostId: "post-1",
    createdAt: new Date(Date.now() - 200000000),
  },
];

const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    fromUserId: "user-2",
    toUserId: "user-1",
    amount: 15,
    type: "TIP",
    postId: "post-1",
    commentId: "comment-1",
    createdAt: new Date(Date.now() - 100000000),
    status: "COMPLETED",
    txHash: "0.0.123456",
  },
  {
    id: "tx-2",
    fromUserId: "user-3",
    toUserId: "user-1",
    amount: 25,
    type: "TIP",
    postId: "post-1",
    commentId: "comment-2",
    createdAt: new Date(Date.now() - 90000000),
    status: "COMPLETED",
    txHash: "0.0.123457",
  },
];

const mockLLMContributions: LLMContribution[] = [
  {
    id: "llm-1",
    postId: "post-1",
    dataQuality: "HIGH",
    usedForTraining: true,
    contentHash: "0x12345...",
    createdAt: new Date(Date.now() - 1000000),
  },
  {
    id: "llm-2",
    postId: "post-2",
    dataQuality: "HIGH",
    usedForTraining: true,
    contentHash: "0x67890...",
    createdAt: new Date(Date.now() - 900000),
  },
];

class ApiService {
  // User APIs
  async getUsers(): Promise<User[]> {
    return [...mockUsers];
  }

  async getUser(userId: string): Promise<User | null> {
    return mockUsers.find(u => u.id === userId) || null;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
    return mockUsers[userIndex];
  }

  // Post APIs
  async getPosts(category?: ContentCategory, tag?: string, search?: string): Promise<Post[]> {
    let filteredPosts = [...mockPosts];
    
    if (category) {
      filteredPosts = filteredPosts.filter(p => p.category === category);
    }
    
    if (tag) {
      filteredPosts = filteredPosts.filter(p => p.tags.includes(tag));
    }
    
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(p => 
        p.title.toLowerCase().includes(searchLower) || 
        p.content.toLowerCase().includes(searchLower)
      );
    }
    
    return filteredPosts;
  }

  async getPost(postId: string): Promise<Post | null> {
    return mockPosts.find(p => p.id === postId) || null;
  }

  async createPost(postData: Partial<Post>): Promise<Post> {
    const author = mockUsers.find(u => u.id === postData.authorId);
    if (!author) {
      throw new Error("Author not found");
    }
    
    const newPost: Post = {
      id: `post-${mockPosts.length + 1}`,
      title: postData.title || "Untitled Post",
      content: postData.content || "",
      authorId: postData.authorId || "",
      author: author,
      category: postData.category || "RESOURCE",
      tags: postData.tags || [],
      tipAmount: 0,
      votes: 0,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      commentCount: 0,
      ...postData,
    };
    
    mockPosts.push(newPost);
    return newPost;
  }

  async updatePost(postId: string, postData: Partial<Post>): Promise<Post> {
    const postIndex = mockPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      throw new Error("Post not found");
    }
    
    mockPosts[postIndex] = { 
      ...mockPosts[postIndex], 
      ...postData,
      updatedAt: new Date()
    };
    return mockPosts[postIndex];
  }

  // Comment APIs
  async getComments(postId: string): Promise<Comment[]> {
    return mockComments.filter(c => c.postId === postId);
  }

  async addComment(commentData: Partial<Comment>): Promise<Comment> {
    const author = mockUsers.find(u => u.id === commentData.authorId);
    if (!author) {
      throw new Error("Author not found");
    }
    
    const newComment: Comment = {
      id: `comment-${mockComments.length + 1}`,
      content: commentData.content || "",
      authorId: commentData.authorId || "",
      author: author,
      postId: commentData.postId || "",
      tipAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...commentData,
    };
    
    mockComments.push(newComment);
    
    // Update comment count on post
    const postIndex = mockPosts.findIndex(p => p.id === newComment.postId);
    if (postIndex !== -1) {
      mockPosts[postIndex].commentCount += 1;
    }
    
    return newComment;
  }

  // Tag APIs
  async getTags(): Promise<Tag[]> {
    return [...mockTags];
  }

  // Notification APIs
  async getNotifications(userId: string): Promise<Notification[]> {
    return mockNotifications.filter(n => n.userId === userId);
  }

  async markNotificationRead(notificationId: string): Promise<Notification> {
    const notifIndex = mockNotifications.findIndex(n => n.id === notificationId);
    if (notifIndex === -1) {
      throw new Error("Notification not found");
    }
    
    mockNotifications[notifIndex].read = true;
    return mockNotifications[notifIndex];
  }

  // Transaction APIs
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return mockTransactions.filter(t => t.fromUserId === userId || t.toUserId === userId);
  }

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: `tx-${mockTransactions.length + 1}`,
      fromUserId: transactionData.fromUserId || "",
      toUserId: transactionData.toUserId || "",
      amount: transactionData.amount || 0,
      type: transactionData.type || "TIP",
      createdAt: new Date(),
      status: "PENDING",
      ...transactionData,
    };
    
    mockTransactions.push(newTransaction);
    return newTransaction;
  }

  // LLM Data APIs
  async getLLMContributions(postId?: string): Promise<LLMContribution[]> {
    if (postId) {
      return mockLLMContributions.filter(c => c.postId === postId);
    }
    return [...mockLLMContributions];
  }

  async addLLMContribution(postId: string, quality: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<LLMContribution> {
    const newContribution: LLMContribution = {
      id: `llm-${mockLLMContributions.length + 1}`,
      postId,
      dataQuality: quality,
      usedForTraining: quality === 'HIGH',
      contentHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
      createdAt: new Date(),
    };
    
    mockLLMContributions.push(newContribution);
    return newContribution;
  }

  // Leaderboard API
  async getLeaderboard(): Promise<User[]> {
    // Sort users by tokens in descending order
    return [...mockUsers].sort((a, b) => b.tokens - a.tokens);
  }

  // Search API
  async search(query: string): Promise<Post[]> {
    if (!query || query.trim().length < 3) {
      return [];
    }
    
    const searchLower = query.toLowerCase();
    return mockPosts.filter(p => 
      p.title.toLowerCase().includes(searchLower) || 
      p.content.toLowerCase().includes(searchLower) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
}

export const apiService = new ApiService();
export default apiService;
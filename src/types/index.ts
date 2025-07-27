export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  walletAddress: string;
  tokens: number;
  createdAt: Date;
  isAdmin?: boolean;
}

export type ContentCategory = 'QA' | 'RESOURCE';

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: User;
  category: ContentCategory;
  tags: string[];
  tipAmount: number;
  votes: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  isAccepted?: boolean; // For answers to questions
  questionId?: string; // For answers to questions
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  postId: string;
  tipAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  count: number;
  description?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'TIP' | 'COMMENT' | 'MENTION' | 'ANSWER' | 'ACCEPT';
  message: string;
  read: boolean;
  relatedPostId?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: 'TIP' | 'REWARD' | 'SYSTEM';
  postId?: string;
  commentId?: string;
  createdAt: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  txHash?: string;
}

export interface HeadelaToken {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
}

export interface LLMContribution {
  id: string;
  postId: string;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  usedForTraining: boolean;
  contentHash: string;
  createdAt: Date;
}
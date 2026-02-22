export type UserRank = "Helper" | "Contributor" | "Expert" | "Legend";

export interface Author {
  username: string;
  avatar: string;
  rank: UserRank;
}

export interface User extends Author {
  accountId?: string;
  rank: UserRank;
}

export interface QuestionMetadata {
  questionId: string;
  title: string;
  tags: string[];
  bounty: number;
  author: string | Author;
  cid: string;
  timestamp: number;
}

export interface QuestionContent {
  description: string;
  codeSnippet?: string;
}

export interface Question extends QuestionMetadata {
  sequenceNumber: number;
  id: string; // Alias for questionId (compatibility)
  description: string;
  codeSnippet?: string;
  author: Author;
  stats: {
    answers: number;
    views?: number;
    likes?: number;
  };
  isSolved: boolean;
  createdAt: string;
  rank?: UserRank;
}

export interface QuestionsResponse {
  questions: Question[];
  nextLink: string | null;
  hasMore: boolean;
}

/**
 * Answer Types
 */
export interface AnswerMetadata {
  answerId: string;
  questionId: string;
  author: string | Author;
  cid: string;
  timestamp: number;
  isAI?: boolean;
  confidence?: number;
}

export interface AnswerContent {
  content: string;
}

export interface Answer extends AnswerMetadata {
  id?: string; // Alias for answerId
  content: string;
  author: Author;
  isAccepted: boolean;
  confidence?: number;
  createdAt: string;
}

/**
 * Acceptance Types
 */
export interface AcceptanceMetadata {
  answerId: string;
  questionId: string;
  acceptedBy: string;
  timestamp: number;
}

/**
 * Update/News Types
 */
export interface UpdateMetadata {
  updateId: string;
  title: string;
  tags: string[];
  url?: string;
  author: string | Author;
  cid: string;
  timestamp: number;
  image?: string;
}

export interface UpdateContent {
  content: string;
}

export interface Update extends UpdateMetadata {
  sequenceNumber?: number;
  id?: string; // Alias for updateId
  content: string;
  createdAt: string;
}

export interface UpdatesResponse {
  updates: Update[];
  nextLink: string | null;
  hasMore: boolean;
}

/**
 * Comment Types
 */
export interface CommentMetadata {
  commentId: string;
  parentId: string; // ID of parent (question/answer/update)
  author: string | Author;
  cid: string;
  timestamp: number;
}

export interface CommentContent {
  content: string;
}

export interface Comment extends CommentMetadata {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
}

/**
 * HCS Message Types
 */
export interface HCSMessage {
  sequenceNumber: number;
  content: string;
  timestamp: string;
  consensus_timestamp: string;
  payer_account_id: string;
  transaction_id: string;
}

export interface HCSMessagesResponse {
  messages: HCSMessage[];
  links: {
    next?: string;
  };
}

/**
 * Pagination Types
 */
export interface PaginatedMessages {
  messages: HCSMessage[];
  nextLink: string | null;
}

/**
 * Internal Types
 */
export type RankMap = Record<string, UserRank>;

export interface AuthorScore {
  [accountId: string]: number;
}

/**
 * Topic Configuration
 */
export interface TopicIds {
  QUESTIONS: string;
  ANSWERS: string;
  ACCEPTANCES: string;
  UPDATES: string;
  COMMENTS: string;
}

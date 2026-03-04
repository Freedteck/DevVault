/**
 * Lean view-model types for feed cards and detail pages.
 * These are derived from HCS payloads after Mirror Node decoding.
 * Cards use shortDescription; detail pages use body (fetched separately).
 */

export interface LiveAuthor {
  accountId: string;
  displayName: string;
}

export interface LiveQuestion {
  sequenceNumber: number;
  consensusTimestamp: string; // ISO-ish from Mirror Node
  title: string;
  shortDescription: string;
  body?: string;
  tags: string[];
  author: LiveAuthor;
  bountyAmount: number;
  bountyCurrency: "VRS" | "HBAR";
  discussionTopicId: string;
  // Derived / estimated from answers (not available in HCS message itself)
  answerCount?: number;
  accepted?: boolean;
  /** Sequence number of the accepted ANSWER on the discussion topic */
  acceptedAnswerSequence?: number;
}

export interface LiveUpdate {
  sequenceNumber: number;
  consensusTimestamp: string;
  title: string;
  shortDescription: string;
  tags: string[];
  author: LiveAuthor;
  discussionTopicId?: string;
  commentCount?: number;
}

export interface LiveAnswer {
  sequenceNumber: number;
  consensusTimestamp: string;
  body: string;
  author: LiveAuthor;
  accepted?: boolean;
}

export interface LiveComment {
  sequenceNumber: number;
  consensusTimestamp: string;
  body: string;
  author: LiveAuthor;
}

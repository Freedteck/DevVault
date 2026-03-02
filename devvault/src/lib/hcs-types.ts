/**
 * Canonical HCS message payload types for DevVault.
 *
 * These types define what gets stored on-chain in each HCS topic.
 * All payloads MUST include [key: string]: unknown for SDK compatibility.
 *
 * Rendering Strategy:
 *   - `shortDescription` is displayed in feed cards (loaded eagerly from Mirror Node)
 *   - `body` (full Markdown) is fetched only on the detail page
 */

export interface HCSAuthor {
  accountId: string;
  displayName: string;
}

// ─── Questions Topic ────────────────────────────────────────────────────────

export interface HCSQuestionPayload {
  type: "QUESTION";
  title: string;
  shortDescription: string; // ≤160 chars — for card display
  body: string; // Full Markdown or truncated fallback if bodyCid is set
  bodyCid?: string; // IPFS CID for full body (bypasses 1024-byte HCS limit)
  tags: string[];
  author: HCSAuthor;
  bountyAmount: number;
  bountyCurrency: "DVT" | "HBAR";
  discussionTopicId: string; // created by platform before user signs
  [key: string]: unknown;
}

// ─── Per-Question Discussion Topics ────────────────────────────────────────

export interface HCSAnswerPayload {
  type: "ANSWER";
  questionSequenceNumber: number;
  body: string; // Full Markdown or truncated fallback if bodyCid is set
  bodyCid?: string; // IPFS CID for full body
  author: HCSAuthor;
  [key: string]: unknown;
}

export interface HCSCommentPayload {
  type: "COMMENT";
  body: string;
  author: HCSAuthor;
  [key: string]: unknown;
}

// ─── Updates Topic ──────────────────────────────────────────────────────────

export interface HCSUpdatePayload {
  type: "UPDATE";
  title: string;
  shortDescription: string; // ≤160 chars — for card display
  body: string; // Full Markdown — for detail page
  tags: string[];
  author: HCSAuthor;
  discussionTopicId?: string; // created by platform before user signs
  [key: string]: unknown;
}

// ─── Answer Acceptance ─────────────────────────────────────────────────────

export interface HCSAcceptPayload {
  type: "ACCEPT";
  /** Sequence number of the accepted ANSWER message on the discussionTopic */
  acceptedMessageSequence: number;
  /** Account ID of the answerer receiving the bounty (if any) */
  answererAccountId: string;
  timestamp: number;
  [key: string]: unknown;
}

// ─── Registry Topic ─────────────────────────────────────────────────────────

export interface HCSProfilePayload {
  type: "PROFILE";
  displayName: string;
  bio?: string;
  skills?: string[];
  authorAccountId: string;
  [key: string]: unknown;
}

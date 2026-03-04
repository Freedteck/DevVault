"use client";

/**
 * Client-side Hedera transaction utilities.
 *
 * Architecture:
 * - The CLIENT calls an API route first (coordination: get topic IDs, validate).
 * - Then the USER'S WALLET signs and submits the actual HCS message.
 * - The platform NEVER signs user-content transactions.
 *
 * NOTE: Uses @hiero-ledger/sdk (not @hashgraph/sdk) because
 * @hashgraph/hedera-wallet-connect uses @hiero-ledger/sdk internally.
 */

import { DAppConnector } from "@hashgraph/hedera-wallet-connect";
import {
  TopicMessageSubmitTransaction,
  TopicId,
  TransferTransaction,
  AccountUpdateTransaction,
  TokenAssociateTransaction,
  AccountId,
  TokenId,
  Hbar,
} from "@hiero-ledger/sdk";
import type {
  HCSAuthor,
  HCSQuestionPayload,
  HCSAnswerPayload,
  HCSCommentPayload,
  HCSUpdatePayload,
  HCSAcceptPayload,
  HCSProfilePayload,
} from "@/lib/hcs-types";

// ─── Core ────────────────────────────────────────────────────────────────────

function getSigner(connector: DAppConnector, accountId: string) {
  const signer = connector.signers.find(
    (s) => s.getAccountId().toString() === accountId,
  );
  if (!signer) {
    throw new Error(`No signer for ${accountId}. Is the wallet connected?`);
  }
  return signer;
}

async function userSubmitHCSMessage(
  connector: DAppConnector,
  accountId: string,
  topicId: string,
  payload: Record<string, unknown>,
): Promise<{ transactionId: string }> {
  const signer = getSigner(connector, accountId);
  const message = JSON.stringify(payload);

  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message);

  const result = await tx.executeWithSigner(signer);

  return { transactionId: result.transactionId?.toString() ?? "" };
}

// ─── Questions ───────────────────────────────────────────────────────────────

export interface PostQuestionInput {
  title: string;
  shortDescription: string; // ≤160 chars, shown in feed cards
  body: string; // full Markdown, shown on detail page
  tags: string[];
  author: HCSAuthor;
  bountyAmount?: number;
  bountyCurrency?: "VRS" | "HBAR";
}

/**
 * Two-step Question Submission:
 *   1. Call /api/questions → platform creates discussion topic (operator pays)
 *   2. User's wallet signs and submits the QUESTION payload to HCS
 */
export async function userPostQuestion(
  connector: DAppConnector,
  input: PostQuestionInput,
): Promise<{ transactionId: string; discussionTopicId: string }> {
  // Step 1: Platform creates discussion topic + uploads body to IPFS
  const res = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: input.body }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? "Failed to create discussion topic");

  const discussionTopicId: string = data.discussionTopicId;
  const bodyCid: string | undefined = data.bodyCid;
  const questionsTopicId = process.env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID!;

  // Step 2: User's wallet signs and submits the question message
  // If bodyCid is set, store only a short body fallback in HCS (saves bytes)
  const payload: HCSQuestionPayload = {
    type: "QUESTION",
    title: input.title,
    shortDescription: input.shortDescription,
    body: bodyCid ? input.shortDescription : input.body,
    ...(bodyCid && { bodyCid }),
    tags: input.tags,
    author: input.author,
    bountyAmount: input.bountyAmount ?? 0,
    bountyCurrency: input.bountyCurrency ?? "VRS",
    discussionTopicId,
  };

  const { transactionId } = await userSubmitHCSMessage(
    connector,
    input.author.accountId,
    questionsTopicId,
    payload,
  );

  return { transactionId, discussionTopicId };
}

// ─── Answers ─────────────────────────────────────────────────────────────────

export interface PostAnswerInput {
  discussionTopicId: string;
  questionSequenceNumber: number;
  body: string;
  author: HCSAuthor;
}

/**
 * Post an ANSWER to a question's discussion topic.
 * The user's wallet signs and submits the message.
 */
export async function userPostAnswer(
  connector: DAppConnector,
  input: PostAnswerInput,
): Promise<{ transactionId: string }> {
  // Validate via API (can add rate limiting, auth checks here later)
  const res = await fetch("/api/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discussionTopicId: input.discussionTopicId }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? "Failed to validate answer submission");

  const payload: HCSAnswerPayload = {
    type: "ANSWER",
    questionSequenceNumber: input.questionSequenceNumber,
    body: input.body,
    author: input.author,
  };

  return userSubmitHCSMessage(
    connector,
    input.author.accountId,
    input.discussionTopicId,
    payload,
  );
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface PostCommentInput {
  discussionTopicId: string;
  body: string;
  author: HCSAuthor;
}

export async function userPostComment(
  connector: DAppConnector,
  input: PostCommentInput,
): Promise<{ transactionId: string }> {
  const payload: HCSCommentPayload = {
    type: "COMMENT",
    body: input.body,
    author: input.author,
  };

  return userSubmitHCSMessage(
    connector,
    input.author.accountId,
    input.discussionTopicId,
    payload,
  );
}

// ─── Updates ─────────────────────────────────────────────────────────────────

export interface PostUpdateInput {
  title: string;
  shortDescription: string; // ≤160 chars, shown in feed cards
  body: string; // full Markdown, shown on detail page
  tags: string[];
  author: HCSAuthor;
}

/**
 * Post a community UPDATE to HCS.
 * The user's wallet signs and submits the message.
 */
export async function userPostUpdate(
  connector: DAppConnector,
  input: PostUpdateInput,
): Promise<{ transactionId: string; discussionTopicId?: string }> {
  const res = await fetch("/api/updates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: input.body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to get updates topic");

  const updatesTopicId: string = data.updatesTopicId;
  const bodyCid: string | undefined = data.bodyCid;
  const discussionTopicId: string | undefined = data.discussionTopicId;

  const payload: HCSUpdatePayload = {
    type: "UPDATE",
    title: input.title,
    shortDescription: input.shortDescription,
    body: bodyCid ? input.shortDescription : input.body,
    ...(bodyCid && { bodyCid }),
    ...(discussionTopicId && { discussionTopicId }),
    tags: input.tags,
    author: input.author,
  };

  return userSubmitHCSMessage(
    connector,
    input.author.accountId,
    updatesTopicId,
    payload,
  );
}

// ─── Tipping ─────────────────────────────────────────────────────────────────

/**
 * Send an HBAR tip — user signs from their own wallet to recipient.
 */
export async function userSendHBARTip(
  connector: DAppConnector,
  fromAccountId: string,
  toAccountId: string,
  amountHbar: number,
): Promise<{ transactionId: string }> {
  const signer = getSigner(connector, fromAccountId);

  const tx = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(fromAccountId), new Hbar(-amountHbar))
    .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amountHbar));

  const result = await tx.executeWithSigner(signer);

  return { transactionId: result.transactionId?.toString() ?? "" };
}

/**
 * Send a VRS tip — user signs an HTS token transfer from their wallet to recipient.
 * amountVRS is in whole VRS units (e.g. 5 = 5 VRS = 500 in the smallest unit at 2 decimals).
 */
export async function userSendVRSTip(
  connector: DAppConnector,
  fromAccountId: string,
  toAccountId: string,
  amountVRS: number,
): Promise<{ transactionId: string }> {
  const tokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;
  if (!tokenId) throw new Error("VRS token ID not configured");

  const signer = getSigner(connector, fromAccountId);
  // VRS has 2 decimals: 5 VRS = 500 units
  const units = Math.round(amountVRS * 100);

  const tx = new TransferTransaction()
    .addTokenTransfer(
      TokenId.fromString(tokenId),
      AccountId.fromString(fromAccountId),
      -units,
    )
    .addTokenTransfer(
      TokenId.fromString(tokenId),
      AccountId.fromString(toAccountId),
      units,
    );

  const result = await tx.executeWithSigner(signer);

  return { transactionId: result.transactionId?.toString() ?? "" };
}

/**
 * Lock a VRS bounty by transferring VRS from the user to the platform operator
 * account as escrow. The platform releases it to the answerer on answer acceptance.
 * amountVRS is in whole units (e.g. 50 = 50 VRS).
 */
export async function userLockVRSBounty(
  connector: DAppConnector,
  fromAccountId: string,
  amountVRS: number,
): Promise<{ transactionId: string }> {
  const tokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;
  if (!tokenId) throw new Error("VRS token ID not configured");
  const escrowAccountId = process.env.NEXT_PUBLIC_OPERATOR_ACCOUNT_ID;
  if (!escrowAccountId) throw new Error("Escrow account not configured");

  const signer = getSigner(connector, fromAccountId);
  const units = Math.round(amountVRS * 100); // 2 decimals

  const tx = new TransferTransaction()
    .addTokenTransfer(
      TokenId.fromString(tokenId),
      AccountId.fromString(fromAccountId),
      -units,
    )
    .addTokenTransfer(
      TokenId.fromString(tokenId),
      AccountId.fromString(escrowAccountId),
      units,
    );

  const result = await tx.executeWithSigner(signer);
  return { transactionId: result.transactionId?.toString() ?? "" };
}

// ─── Answer Acceptance ────────────────────────────────────────────────────────

export interface AcceptAnswerInput {
  /** The question's dedicated discussion HCS topic */
  discussionTopicId: string;
  /** Sequence number of the ANSWER message being accepted */
  acceptedMessageSequence: number;
  /** Account ID of the answerer (for bounty release later) */
  answererAccountId: string;
  /** Account ID of the question asker (who is signing) */
  askerAccountId: string;
}

/**
 * Mark an answer as accepted by posting an ACCEPT message to the discussion topic.
 * Only the original question asker should call this (enforced by wallet identity).
 */
export async function userAcceptAnswer(
  connector: DAppConnector,
  input: AcceptAnswerInput,
): Promise<{ transactionId: string }> {
  const payload: HCSAcceptPayload = {
    type: "ACCEPT",
    acceptedMessageSequence: input.acceptedMessageSequence,
    answererAccountId: input.answererAccountId,
    timestamp: Math.floor(Date.now() / 1000),
  };

  return userSubmitHCSMessage(
    connector,
    input.askerAccountId,
    input.discussionTopicId,
    payload,
  );
}

// ─── HCS-11 Profiles ─────────────────────────────────────────────────────────

export interface CreateProfileInput {
  accountId: string;
  displayName: string;
  bio?: string;
  skills?: string[];
}

/**
 * HCS-11 profile creation — three-step flow:
 *   1. Platform creates a dedicated HCS profile topic (operator pays).
 *   2. User's wallet posts a PROFILE message to that topic.
 *   3. User's wallet sets their account memo to "hcs11:0.0.{profileTopicId}".
 *
 * Returns the new profile topic ID.
 */
export async function userCreateProfile(
  connector: DAppConnector,
  input: CreateProfileInput,
): Promise<{ profileTopicId: string; transactionId: string }> {
  // Step 1: Platform creates profile topic
  const res = await fetch("/api/profile", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create profile topic");
  const profileTopicId: string = data.profileTopicId;

  // Step 2: User posts PROFILE message to their topic
  const payload: HCSProfilePayload = {
    type: "PROFILE",
    displayName: input.displayName,
    bio: input.bio ?? "",
    skills: input.skills ?? [],
    authorAccountId: input.accountId,
  };
  await userSubmitHCSMessage(
    connector,
    input.accountId,
    profileTopicId,
    payload,
  );

  // Step 3: User updates account memo to point to profile topic (HCS-11)
  // and enables auto-association for future tokens (VRS rewards/tips)
  const signer = getSigner(connector, input.accountId);
  const memoTx = new AccountUpdateTransaction()
    .setAccountId(AccountId.fromString(input.accountId))
    .setAccountMemo(`hcs11:${profileTopicId}`)
    .setMaxAutomaticTokenAssociations(10);

  const result = await memoTx.executeWithSigner(signer);

  return {
    profileTopicId,
    transactionId: result.transactionId?.toString() ?? "",
  };
}

/**
 * Update an existing HCS-11 profile by posting a new PROFILE message.
 * The account memo already points to the profile topic — no memo update needed.
 */
export async function userUpdateProfile(
  connector: DAppConnector,
  profileTopicId: string,
  input: Omit<CreateProfileInput, "accountId"> & { accountId: string },
): Promise<{ transactionId: string }> {
  const payload: HCSProfilePayload = {
    type: "PROFILE",
    displayName: input.displayName,
    bio: input.bio ?? "",
    skills: input.skills ?? [],
    authorAccountId: input.accountId,
  };
  return userSubmitHCSMessage(
    connector,
    input.accountId,
    profileTopicId,
    payload,
  );
}

// ─── Token Association ────────────────────────────────────────────────────────────────────────────

/**
 * Check whether an account already has the VRS token associated via Mirror Node.
 */
export async function isVRSAssociated(accountId: string): Promise<boolean> {
  const tokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;
  if (!tokenId) return false;
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK;
  const base =
    network === "mainnet"
      ? "https://mainnet-public.mirrornode.hedera.com/api/v1"
      : "https://testnet.mirrornode.hedera.com/api/v1";
  try {
    const res = await fetch(
      `${base}/accounts/${accountId}/tokens?token.id=${tokenId}`,
    );
    if (!res.ok) return false;
    const body = await res.json();
    return (body.tokens ?? []).length > 0;
  } catch {
    return false;
  }
}

/**
 * Associate the VRS token with the user's wallet account.
 * Must be called before the user can receive VRS (e.g. before a swap).
 */
export async function userAssociateVRS(
  connector: DAppConnector,
  accountId: string,
): Promise<{ transactionId: string }> {
  const tokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;
  if (!tokenId) throw new Error("VRS token ID not configured");
  const signer = getSigner(connector, accountId);

  const tx = new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(accountId))
    .setTokenIds([TokenId.fromString(tokenId)]);

  const result = await tx.executeWithSigner(signer);
  return { transactionId: result.transactionId?.toString() ?? "" };
}

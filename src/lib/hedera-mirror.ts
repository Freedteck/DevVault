/**
 * Mirror Node API client for reading live HCS topic messages.
 * Uses the public Hedera Mirror Node REST API — safe for client-side use.
 */

const MIRROR_NODE_BASE =
  process.env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
    ? "https://mainnet.mirrornode.hedera.com/api/v1"
    : "https://testnet.mirrornode.hedera.com/api/v1";

/**
 * Enhanced fetch with basic retry logic for Mirror Node stability.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoff = 500,
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok && retries > 0 && res.status >= 500) {
      throw new Error(`Mirror Node HTTP ${res.status}`);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`[Mirror Node] Fetch failed, retrying in ${backoff}ms...`, {
        url,
        error: String(err),
      });
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

export interface HCSMessage {
  consensus_timestamp: string;
  message: string; // base64 encoded
  payer_account_id: string;
  sequence_number: number;
  topic_id: string;
}

export interface ParsedHCSMessage<T = Record<string, unknown>> {
  sequenceNumber: number;
  consensusTimestamp: string;
  payerAccountId: string;
  data: T;
  /** Populated when getTopicMessagesPaged is called with withAnswerCount=true */
  answerCount?: number;
}

/**
 * Decode a base64 HCS message payload into a typed object.
 * Returns null if the payload is not valid JSON (e.g. a raw text message).
 */
function decodeMessage<T>(base64: string): T | null {
  try {
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

/**
 * Fetch all messages from a given HCS topic, newest first.
 * @param topicId - e.g. "0.0.8056232"
 * @param limit - Maximum number of messages to fetch
 */
export async function getTopicMessages<T = Record<string, unknown>>(
  topicId: string,
  limit = 100,
): Promise<ParsedHCSMessage<T>[]> {
  const url = `${MIRROR_NODE_BASE}/topics/${topicId}/messages?limit=${limit}&order=desc`;
  const res = await fetchWithRetry(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Mirror Node error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const messages: HCSMessage[] = json.messages ?? [];

  const parsed: ParsedHCSMessage<T>[] = [];
  for (const msg of messages) {
    const data = decodeMessage<T>(msg.message);
    if (data === null) continue;
    parsed.push({
      sequenceNumber: msg.sequence_number,
      consensusTimestamp: msg.consensus_timestamp,
      payerAccountId: msg.payer_account_id,
      data,
    });
  }
  return parsed;
}

/**
 * Fetch a single message from a given HCS topic by its sequence number.
 * @param topicId - e.g. "0.0.8056232"
 * @param sequenceNumber - The exact sequence number of the message
 */
export async function getTopicMessage<T = Record<string, unknown>>(
  topicId: string,
  sequenceNumber: number,
): Promise<ParsedHCSMessage<T>> {
  const url = `${MIRROR_NODE_BASE}/topics/${topicId}/messages/${sequenceNumber}`;
  const res = await fetchWithRetry(url, { cache: "no-store" });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Message not found: sequence ${sequenceNumber}`);
    }
    throw new Error(`Mirror Node error: ${res.status} ${res.statusText}`);
  }

  const msg: HCSMessage = await res.json();
  const data = decodeMessage<T>(msg.message);
  if (data === null) {
    throw new Error(`Message ${sequenceNumber} is not valid JSON`);
  }

  return {
    sequenceNumber: msg.sequence_number,
    consensusTimestamp: msg.consensus_timestamp,
    payerAccountId: msg.payer_account_id,
    data,
  };
}

/**
 * Fetch a page of messages from a topic, newest-first (cursor-based pagination).
 *
 * @param topicId  - e.g. "0.0.8056232"
 * @param limit    - Items per page (default 20)
 * @param cursor   - consensus_timestamp (exclusive upper bound). Pass the value
 *                   returned as `nextCursor` from the previous page to go back
 *                   in time. Omit or pass undefined for the first (latest) page.
 *
 * Returns `nextCursor`: the consensus_timestamp of the oldest message on the
 * current page. Pass it as `cursor` to fetch the next (older) page.
 * `nextCursor` is null when this is the last page (Mirror Node has no more).
 */
export async function getTopicMessagesPaged<T = Record<string, unknown>>(
  topicId: string,
  limit = 20,
  cursor?: string,
  /** When true, fetches the sequence_number of each message's discussionTopicId and attaches it as `answerCount`. */
  withAnswerCount = false,
): Promise<{ messages: ParsedHCSMessage<T>[]; nextCursor: string | null }> {
  let url = `${MIRROR_NODE_BASE}/topics/${topicId}/messages?limit=${limit}&order=desc`;
  if (cursor) url += `&timestamp=lt:${cursor}`;

  const res = await fetchWithRetry(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Mirror Node error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const rawMessages: HCSMessage[] = json.messages ?? [];

  const messages: (ParsedHCSMessage<T> & { answerCount: number })[] = [];
  for (const msg of rawMessages) {
    const data = decodeMessage<T>(msg.message);
    if (data === null) continue;
    messages.push({
      sequenceNumber: msg.sequence_number,
      consensusTimestamp: msg.consensus_timestamp,
      payerAccountId: msg.payer_account_id,
      data,
      answerCount: 0,
    });
  }

  // Optionally enrich each message with the answer/comment count from its discussion topic
  if (withAnswerCount) {
    await Promise.all(
      messages.map(async (msg) => {
        const d = msg.data as Record<string, unknown>;
        const discussionTopicId = d?.discussionTopicId as string | undefined;
        if (!discussionTopicId) return;
        try {
          const info = await getTopicInfo(discussionTopicId);
          msg.answerCount = info.sequenceNumber;
        } catch (e) {
          console.error(
            `Failed to fetch count for topic ${discussionTopicId}:`,
            e,
          );
          // topic may not have messages yet — leave answerCount as 0
        }
      }),
    );
  }

  // If Mirror Node signals there are more items, expose the oldest timestamp
  // on this page as the next cursor.
  const hasMore = Boolean(json.links?.next);
  const nextCursor = hasMore
    ? (rawMessages[rawMessages.length - 1]?.consensus_timestamp ?? null)
    : null;

  return { messages, nextCursor };
}

/**
 * Fetch messages from a topic *after* a given sequence number.
 * Useful for polling new answers to a specific question.
 */
export async function getTopicMessagesSince<T = Record<string, unknown>>(
  topicId: string,
  afterSequenceNumber: number,
): Promise<ParsedHCSMessage<T>[]> {
  const url = `${MIRROR_NODE_BASE}/topics/${topicId}/messages?sequencenumber=gt:${afterSequenceNumber}&order=asc&limit=100`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Mirror Node error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const messages: HCSMessage[] = json.messages ?? [];

  const parsed: ParsedHCSMessage<T>[] = [];
  for (const msg of messages) {
    const data = decodeMessage<T>(msg.message);
    if (data === null) continue;
    parsed.push({
      sequenceNumber: msg.sequence_number,
      consensusTimestamp: msg.consensus_timestamp,
      payerAccountId: msg.payer_account_id,
      data,
    });
  }
  return parsed;
}

/**
 * Fetch account token balances from Mirror Node.
 * Returns VRS balance for a given account.
 */
export async function getTokenBalance(
  accountId: string,
): Promise<{ vrs: number; hbar: number }> {
  const tokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;

  const [tokenRes, accountRes] = await Promise.all([
    fetchWithRetry(
      `${MIRROR_NODE_BASE}/accounts/${accountId}/tokens?token.id=${tokenId}`,
      { next: { revalidate: 30 } },
    ),
    fetchWithRetry(`${MIRROR_NODE_BASE}/accounts/${accountId}`, {
      next: { revalidate: 30 },
    }),
  ]);

  let vrs = 0;
  if (tokenRes.ok) {
    const tokenJson = await tokenRes.json();
    const token = tokenJson.tokens?.[0];
    if (token) vrs = Number(token.balance) / 100; // 2 decimals
  }

  let hbar = 0;
  if (accountRes.ok) {
    const accountJson = await accountRes.json();
    hbar = Number(accountJson.balance?.balance ?? 0) / 100_000_000; // tinybars → HBAR
  }

  return { vrs, hbar };
}

/**
 * Count only genuine ANSWER and AI_ANSWER messages on a discussion topic.
 * Used for the answerCount badge on question cards.
 *
 * Previously we used the raw sequence_number (total messages ever posted),
 * which inflated the count with duplicate-check comments, ACCEPT signals,
 * REPLY messages, and any other non-answer messages the AI agent posts.
 */
export async function getTopicInfo(
  topicId: string,
): Promise<{ sequenceNumber: number }> {
  const res = await fetch(
    `${MIRROR_NODE_BASE}/topics/${topicId}/messages?limit=50&order=desc`,
    { cache: "no-store" },
  );
  if (!res.ok) return { sequenceNumber: 0 };
  const json = await res.json();
  const messages: HCSMessage[] = json.messages ?? [];

  let count = 0;
  for (const msg of messages) {
    const data = decodeMessage<{ type?: string }>(msg.message);
    if (data?.type === "ANSWER" || data?.type === "AI_ANSWER") count++;
  }
  return { sequenceNumber: count };
}

/**
 * Fetch token metadata, including total supply.
 */
export async function getTokenInfo(tokenId: string): Promise<{
  totalSupply: string;
  decimals: number;
}> {
  const res = await fetchWithRetry(`${MIRROR_NODE_BASE}/tokens/${tokenId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return { totalSupply: "0", decimals: 2 };
  const json = await res.json();
  return {
    totalSupply: String(json.total_supply ?? "0"),
    decimals: Number(json.decimals ?? 2),
  };
}

/**
 * Count the total number of unique accounts holding a given token.
 * Paginates through all balance pages (100 per page) to get an exact count.
 * Used to count registered Vurso experts.
 */
export async function getTokenHolderCount(tokenId: string): Promise<number> {
  let count = 0;
  let url: string | null =
    `${MIRROR_NODE_BASE}/tokens/${tokenId}/balances?limit=100&order=asc`;

  while (url) {
    const res = await fetchWithRetry(url, { cache: "no-store" });
    if (!res.ok) break;
    const json = await res.json();
    const balances: { account: string; balance: number }[] =
      json.balances ?? [];
    count += balances.length;
    const nextPath: string | null = json.links?.next ?? null;
    url = nextPath ? `https://testnet.mirrornode.hedera.com${nextPath}` : null;
  }

  return count;
}

/**
 * Fetch the top VRS token holders, sorted by balance descending.
 * Returns { accountId, balance } where balance is in smallest units.
 * VRS has 2 decimals: divide by 100 for display.
 */
export async function getTokenTopHolders(
  tokenId: string,
  limit = 25,
): Promise<Array<{ accountId: string; balance: number }>> {
  const res = await fetchWithRetry(
    `${MIRROR_NODE_BASE}/tokens/${tokenId}/balances?order=desc&limit=${limit}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.balances ?? []).map(
    (b: { account: string; balance: number }) => ({
      accountId: b.account,
      balance: Number(b.balance),
    }),
  );
}

/**
 * Fetch basic account info: HBAR balance (in HBAR) and the account memo.
 * The memo is used for HCS-11 profile lookup: format "hcs11:0.0.XXXXX"
 */
export async function getAccountInfo(
  accountId: string,
): Promise<{ hbarBalance: number; memo: string }> {
  const res = await fetchWithRetry(
    `${MIRROR_NODE_BASE}/accounts/${accountId}`,
    {
      next: { revalidate: 30 },
    },
  );
  if (!res.ok) return { hbarBalance: 0, memo: "" };
  const json = await res.json();
  return {
    hbarBalance: Number(json.balance?.balance ?? 0) / 100_000_000,
    memo: String(json.memo ?? ""),
  };
}

export interface HCS11Profile {
  profileTopicId: string;
  displayName: string;
  bio: string;
  skills: string[];
}

/**
 * Resolve the HCS-11 profile for an account.
 * 1. Reads the account memo on Mirror Node → extracts the profile topic ID ("hcs11:0.0.XXXXX").
 * 2. Fetches the latest PROFILE message from that topic.
 * Returns null if the account has no HCS-11 profile.
 */
export async function getHCS11Profile(
  accountId: string,
): Promise<HCS11Profile | null> {
  try {
    const { memo } = await getAccountInfo(accountId);
    if (!memo.startsWith("hcs11:")) return null;

    const profileTopicId = memo.replace("hcs11:", "").trim();
    const url = `${MIRROR_NODE_BASE}/topics/${profileTopicId}/messages?limit=1&order=desc`;
    const res = await fetchWithRetry(url, { next: { revalidate: 30 } });
    if (!res.ok) return null;

    const json = await res.json();
    const lastMsg = json.messages?.[0];
    if (!lastMsg) return null;

    const payload = JSON.parse(
      Buffer.from(lastMsg.message, "base64").toString("utf-8"),
    ) as Record<string, unknown>;

    return {
      profileTopicId,
      displayName: String(payload.displayName ?? accountId),
      bio: String(payload.bio ?? ""),
      skills: Array.isArray(payload.skills) ? (payload.skills as string[]) : [],
    };
  } catch {
    return null;
  }
}

/**
 * Mirror Node API client for reading live HCS topic messages.
 * Uses the public Hedera Mirror Node REST API — safe for client-side use.
 */

const MIRROR_NODE_BASE =
  process.env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet"
    ? "https://mainnet.mirrornode.hedera.com/api/v1"
    : "https://testnet.mirrornode.hedera.com/api/v1";

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
}

/**
 * Decode a base64 HCS message payload into a typed object.
 */
function decodeMessage<T>(base64: string): T {
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(decoded) as T;
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
  const res = await fetch(url, { next: { revalidate: 30 } }); // cache for 30s

  if (!res.ok) {
    throw new Error(`Mirror Node error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const messages: HCSMessage[] = json.messages ?? [];

  return messages.map((msg) => ({
    sequenceNumber: msg.sequence_number,
    consensusTimestamp: msg.consensus_timestamp,
    payerAccountId: msg.payer_account_id,
    data: decodeMessage<T>(msg.message),
  }));
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
  const res = await fetch(url, { next: { revalidate: 30 } }); // cache for 30s

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Message not found: sequence ${sequenceNumber}`);
    }
    throw new Error(`Mirror Node error: ${res.status} ${res.statusText}`);
  }

  const msg: HCSMessage = await res.json();

  return {
    sequenceNumber: msg.sequence_number,
    consensusTimestamp: msg.consensus_timestamp,
    payerAccountId: msg.payer_account_id,
    data: decodeMessage<T>(msg.message),
  };
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

  return messages.map((msg) => ({
    sequenceNumber: msg.sequence_number,
    consensusTimestamp: msg.consensus_timestamp,
    payerAccountId: msg.payer_account_id,
    data: decodeMessage<T>(msg.message),
  }));
}

/**
 * Fetch account token balances from Mirror Node.
 * Returns DVT balance for a given account.
 */
export async function getTokenBalance(
  accountId: string,
): Promise<{ dvt: number; hbar: number }> {
  const tokenId = process.env.NEXT_PUBLIC_DVT_TOKEN_ID;

  const [tokenRes, accountRes] = await Promise.all([
    fetch(
      `${MIRROR_NODE_BASE}/accounts/${accountId}/tokens?token.id=${tokenId}`,
      { next: { revalidate: 30 } },
    ),
    fetch(`${MIRROR_NODE_BASE}/accounts/${accountId}`, {
      next: { revalidate: 30 },
    }),
  ]);

  let dvt = 0;
  if (tokenRes.ok) {
    const tokenJson = await tokenRes.json();
    const token = tokenJson.tokens?.[0];
    if (token) dvt = Number(token.balance) / 100; // 2 decimals
  }

  let hbar = 0;
  if (accountRes.ok) {
    const accountJson = await accountRes.json();
    hbar = Number(accountJson.balance?.balance ?? 0) / 100_000_000; // tinybars → HBAR
  }

  return { dvt, hbar };
}

/**
 * Fetch topic metadata — primarily used to get the current sequence_number,
 * which equals the total number of messages ever posted to the topic.
 * We use this as a cheap proxy for answerCount / commentCount.
 */
export async function getTopicInfo(
  topicId: string
): Promise<{ sequenceNumber: number }> {
  const res = await fetch(`${MIRROR_NODE_BASE}/topics/${topicId}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return { sequenceNumber: 0 };
  const json = await res.json();
  return { sequenceNumber: Number(json.sequence_number ?? 0) };
}

/**
 * Fetch the top DVT token holders, sorted by balance descending.
 * Returns { accountId, balance } where balance is in smallest units.
 * DVT has 2 decimals: divide by 100 for display.
 */
export async function getTokenTopHolders(
  tokenId: string,
  limit = 25,
): Promise<Array<{ accountId: string; balance: number }>> {
  const res = await fetch(
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
  const res = await fetch(`${MIRROR_NODE_BASE}/accounts/${accountId}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return { hbarBalance: 0, memo: "" };
  const json = await res.json();
  return {
    hbarBalance: Number(json.balance?.balance ?? 0) / 100_000_000,
    memo: String(json.memo ?? ""),
  };
}

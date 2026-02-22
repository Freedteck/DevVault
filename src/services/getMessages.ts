import { fetchWithRetry } from "../utils/fetchUtils";
import type { PaginatedMessages, HCSMessage } from "../types/index.ts";

/**
 * Get messages with pagination from Hedera Mirror Node
 * @param topicId - Topic ID
 * @param limit - Messages per page
 * @param nextLink - Link for the next page
 * @returns - Paginated messages and next link
 */
export async function getMessagesWithPagination(
  topicId: string,
  limit: number = 10,
  nextLink: string | null = null,
): Promise<PaginatedMessages> {
  const baseUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;
  const url =
    nextLink && nextLink !== "null"
      ? nextLink
      : `${baseUrl}?limit=${limit}&order=desc`;

  const response = await fetchWithRetry(url);
  const data = await response.json();

  const messages: HCSMessage[] = data.messages.map((msg: any) => ({
    sequenceNumber: msg.sequence_number,
    content: msg.message
      ? Buffer.from(msg.message, "base64").toString("utf8").trim()
      : "",
    consensusTimestamp: msg.consensus_timestamp,
    consensus_timestamp: msg.consensus_timestamp,
    payer_account_id: msg.payer_account_id,
    transaction_id: msg.transaction_id,
    timestamp: msg.consensus_timestamp,
  }));

  return {
    messages,
    nextLink: data.links?.next
      ? `https://testnet.mirrornode.hedera.com${data.links.next}`
      : null,
  };
}

/**
 * Get specific message by sequence number
 * @param topicId - Topic ID
 * @param sequenceNumber - Sequence number of message
 * @returns - Message data
 */
export async function getMessageBySequenceNumber(
  topicId: string,
  sequenceNumber: number,
): Promise<HCSMessage> {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages/${sequenceNumber}`;

  const response = await fetchWithRetry(url);
  const msg = await response.json();

  return {
    sequenceNumber: msg.sequence_number,
    content: msg.message
      ? Buffer.from(msg.message, "base64").toString("utf8").trim()
      : "",
    consensusTimestamp: msg.consensus_timestamp,
    consensus_timestamp: msg.consensus_timestamp,
    payer_account_id: msg.payer_account_id,
    transaction_id: msg.transaction_id,
    timestamp: msg.consensus_timestamp,
  } as HCSMessage;
}

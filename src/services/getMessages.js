/* eslint-disable no-undef */
/**
 * Fetch messages from HCS topic via Mirror Node
 * No wallet required - reading is public
 */

/**
 * Get paginated messages from topic
 * @param {string} topicId - Topic ID to fetch from
 * @param {number} limit - Number of messages per page
 * @param {string} nextLink - Next page URL from previous call
 * @returns {Promise<{messages: Array, nextLink: string|null}>}
 */
export async function getMessagesWithPagination(
  topicId,
  limit = 10,
  nextLink = null,
) {
  const baseUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;
  const url = nextLink || `${baseUrl}?limit=${limit}&order=desc`;

  const response = await fetch(url);
  const data = await response.json();

  const messages = data.messages.map((msg) => ({
    sequenceNumber: msg.sequence_number,
    content: Buffer.from(msg.message, "base64").toString("utf8").trim(),
    consensusTimestamp: msg.consensus_timestamp,
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
 * @param {string} topicId - Topic ID
 * @param {number} sequenceNumber - Sequence number of message
 * @returns {Promise<object>} - Message data
 */
export async function getMessageBySequenceNumber(topicId, sequenceNumber) {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages/${sequenceNumber}`;

  const response = await fetch(url);
  const msg = await response.json();

  return {
    sequenceNumber: msg.sequence_number,
    content: Buffer.from(msg.message, "base64").toString("utf8").trim(),
    consensusTimestamp: msg.consensus_timestamp,
  };
}

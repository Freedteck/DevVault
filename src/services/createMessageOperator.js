import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";

/**
 * Submit a message to HCS topic using Hedera Client (operator mode)
 * This is for server-side operations like AI agent posting
 * @param {object} client - Hedera Client with operator set
 * @param {string} topicId - Topic ID to submit to
 * @param {string|object} message - Message content (will be stringified if object)
 * @returns {Promise<[string, object]>} - [status, transactionId]
 */
export async function submitMessageOperator(client, topicId, message) {
  const messageString =
    typeof message === "string" ? message : JSON.stringify(message);

  const transaction = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(messageString)
    .execute(client);

  const receipt = await transaction.getReceipt(client);

  return [receipt.status.toString(), transaction.transactionId];
}

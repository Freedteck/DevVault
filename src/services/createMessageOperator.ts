import { TopicMessageSubmitTransaction, Client } from "@hashgraph/sdk";

/**
 * Submit a message to HCS topic using Hedera Client (operator mode)
 * This is for server-side operations like AI agent posting
 * @param client - Hedera Client with operator set
 * @param topicId - Topic ID to submit to
 * @param message - Message content (will be stringified if object)
 * @returns - [status, transactionId]
 */
export async function submitMessageOperator(
  client: Client,
  topicId: string,
  message: string | object,
): Promise<[string, any]> {
  const messageString =
    typeof message === "string" ? message : JSON.stringify(message);

  const transaction = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(messageString)
    .execute(client);

  const receipt = await transaction.getReceipt(client);

  return [receipt.status.toString(), transaction.transactionId];
}

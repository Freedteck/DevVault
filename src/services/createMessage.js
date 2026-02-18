import { TopicMessageSubmitTransaction, AccountId } from "@hashgraph/sdk";

/**
 * Submit a message to HCS topic using DAppConnector
 * @param {object} dAppConnector - DAppConnector instance from Hedera Wallet Connect
 * @param {string} accountId - User's Hedera account ID (e.g., "0.0.123456")
 * @param {string} topicId - Topic ID to submit to
 * @param {string|object} message - Message content (will be stringified if object)
 * @returns {Promise<[string, object]>} - [status, transactionId]
 */
export async function submitMessage(
  dAppConnector,
  accountId,
  topicId,
  message,
) {
  const signer = dAppConnector.getSigner(AccountId.fromString(accountId));

  const messageString =
    typeof message === "string" ? message : JSON.stringify(message);

  const transaction = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(messageString);

  // DAppSigner.call() handles freezing, signing, and executing
  const txResponse = await signer.call(transaction);

  // Extract status and transactionId safely
  const status =
    txResponse.status?.toString() || txResponse.toString() || "SUCCESS";
  const transactionId = txResponse.transactionId || txResponse;

  return [status, transactionId];
}

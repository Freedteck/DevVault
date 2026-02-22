import { TopicMessageSubmitTransaction, AccountId } from "@hashgraph/sdk";

/**
 * Submit a message to HCS topic using DAppConnector
 * @param dAppConnector - DAppConnector instance from Hedera Wallet Connect
 * @param accountId - User's Hedera account ID (e.g., "0.0.123456")
 * @param topicId - Topic ID to submit to
 * @param message - Message content (will be stringified if object)
 * @returns - [status, transactionId]
 */
export async function submitMessage(
  dAppConnector: any,
  accountId: string,
  topicId: string,
  message: string | object,
): Promise<[string, any]> {
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

import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";

/**
 * Submit a message to HCS topic using wallet signing
 * @param {Array} walletData - [hashconnect, saveData] from walletConnect
 * @param {string} accountId - User's Hedera account ID
 * @param {string} topicId - Topic ID to submit to
 * @param {string|object} message - Message content (will be stringified if object)
 * @returns {Promise<[string, object]>} - [status, transactionId]
 */
export async function submitMessage(walletData, accountId, topicId, message) {
  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId,
  );
  const signer = hashconnect.getSigner(provider);

  const messageString =
    typeof message === "string" ? message : JSON.stringify(message);

  const messageTransaction = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(messageString)
    .freezeWithSigner(signer);

  const messageSubmit = await messageTransaction.executeWithSigner(signer);
  const messageReceipt = await provider.getTransactionReceipt(
    messageSubmit.transactionId,
  );

  return [messageReceipt.status.toString(), messageSubmit.transactionId];
}

import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";

async function acceptAnswer(walletData, accountId, topicId, acceptanceData) {
  console.log(`\n=======================================`);
  console.log(`- Submitting acceptance to topic ${topicId}...`);

  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId
  );
  const signer = hashconnect.getSigner(provider);

  const metadataString = JSON.stringify(acceptanceData);

  //Create the transaction
  const topicMessageTx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(metadataString)
    .freezeWithSigner(signer);

  //Get the transaction message

  const topicMessageSubmit = await topicMessageTx.executeWithSigner(signer);
  const topicMessageRx = await provider.getTransactionReceipt(
    topicMessageSubmit.transactionId
  );

  const topicMessage = topicMessageRx.status;
  console.log(`Acceptance message status: ${topicMessage}`);

  return [topicMessage, topicMessageSubmit.transactionId];
}

export default acceptAnswer;

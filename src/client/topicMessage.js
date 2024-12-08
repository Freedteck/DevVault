import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";

async function topicMessageFnc(walletData, accountId, topicId, metadata) {
  console.log(`\n=======================================`);
  console.log(`- Submitting message to topic ${topicId}...`);

  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId
  );
  const signer = hashconnect.getSigner(provider);

  const metadataString = JSON.stringify(metadata);

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
  console.log(`New Message is ${topicMessage}`);

  return [topicMessage, topicMessageSubmit.transactionId];
}

export default topicMessageFnc;

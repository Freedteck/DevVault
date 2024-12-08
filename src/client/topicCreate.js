import { TopicCreateTransaction } from "@hashgraph/sdk";

async function topicCreate(walletData, accountId) {
  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId
  );
  const signer = hashconnect.getSigner(provider);

  //Create the transaction

  const topicCreateTx = await new TopicCreateTransaction().freezeWithSigner(
    signer
  );

  const topicCreateSubmit = await topicCreateTx.executeWithSigner(signer);
  const topicCreateRx = await provider.getTransactionReceipt(
    topicCreateSubmit.transactionId
  );

  const newTopicId = topicCreateRx.topicId;
  console.log(`- Topic created. New Topic id is ${newTopicId}`);

  return [newTopicId];
}

export default topicCreate;

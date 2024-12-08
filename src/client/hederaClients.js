import {
  AccountBalanceQuery,
  Client,
  Hbar,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
// require("dotenv").config();

const accountId = process.env.REACT_APP_MY_ACCOUNT_ID;
const privateKey = process.env.REACT_APP_MY_PRIVATE_KEY;
async function setup() {
  //Grab your Hedera testnet account ID and private key from your .env file
  // eslint-disable-next-line no-undef
  const myAccountId = accountId;
  // eslint-disable-next-line no-undef
  const myPrivateKey = privateKey;

  // If we weren't able to grab it, we should throw a new error
  if (!myAccountId || !myPrivateKey) {
    throw new Error(
      "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
    );
  }
  //Create your Hedera Testnet client
  const client = Client.forTestnet();

  //Set your account as the client's operator
  client.setOperator(myAccountId, myPrivateKey);

  //Set the default maximum transaction fee (in Hbar)
  client.setDefaultMaxTransactionFee(new Hbar(100));

  //Set the maximum payment for queries (in Hbar)
  client.setMaxQueryPayment(new Hbar(50));

  // get Account balance
  const getBalance = async (accountId) => {
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    // (1 HBAR = 100,000,000 tinybars)
    const hbars = accountBalance.hbars.toString();

    const formattedBalance = parseFloat(hbars).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formattedBalance + " HBAR";
  };

  async function createTopic() {
    const transaction = new TopicCreateTransaction();
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`Created new topic with ID: ${topicId}`);

    return topicId;
  }

  async function submitVideoMetadata(topicId, metadata) {
    const metadataString = JSON.stringify(metadata);

    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(metadataString);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(
      `Submitted video metadata to topic ${topicId} with status: ${receipt.status}`
    );
  }

  async function updateViews(topicId, videoCid, views) {
    const metadata = { videoCid, views };
    const metadataString = JSON.stringify(metadata);

    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(metadataString);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(
      `Updated views for video ${videoCid} in topic ${topicId} with status: ${receipt.status}`
    );
  }
  return { createTopic, submitVideoMetadata, getBalance, updateViews, client };
}

export { setup };

const {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  Hbar,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

async function createUpdatesTopic() {
  const myAccountId = process.env.VITE_MY_ACCOUNT_ID;
  let myPrivateKey = process.env.VITE_MY_PRIVATE_KEY;

  if (!myAccountId || !myPrivateKey) {
    throw new Error(
      "Environment variables VITE_MY_ACCOUNT_ID and VITE_MY_PRIVATE_KEY must be present"
    );
  }

  // Remove 0x prefix if present
  if (myPrivateKey.startsWith("0x")) {
    myPrivateKey = myPrivateKey.slice(2);
  }

  const client = Client.forTestnet();
  client.setOperator(myAccountId, PrivateKey.fromStringECDSA(myPrivateKey));
  client.setDefaultMaxTransactionFee(new Hbar(100));

  try {
    console.log("Creating new Updates Topic...");

    // Create a new topic for updates (no submit key for public access)
    const txResponse = await new TopicCreateTransaction()
      .setTopicMemo("DevVault Updates Topic - Fresh Start")
      .execute(client);

    const receipt = await txResponse.getReceipt(client);
    const newTopicId = receipt.topicId;

    console.log(`\n✅ New Updates Topic created: ${newTopicId}`);
    console.log("\nAdd this to your .env.local file:");
    console.log(`VITE_UPDATES_TOPIC_ID=${newTopicId}`);

    // Submit initial message
    const submitTx = await new TopicMessageSubmitTransaction()
      .setTopicId(newTopicId)
      .setMessage("DevVault Updates Topic initialized")
      .execute(client);

    await submitTx.getReceipt(client);
    console.log("\n✅ Initial message submitted");
  } catch (error) {
    console.error("Error creating topic:", error);
  } finally {
    client.close();
  }
}

createUpdatesTopic();

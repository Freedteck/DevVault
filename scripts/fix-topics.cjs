const {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  Hbar,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

async function fixTopics() {
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
    console.log("🔧 Fixing DevVault Topics - Removing Submit Key Requirements");
    console.log("=============================================================\n");

    // Create new Questions Topic (without submit key for public access)
    console.log("1. Creating new Questions Topic (public access)...");
    const questionsTx = await new TopicCreateTransaction()
      .setTopicMemo("DevVault Questions - Public Access")
      .execute(client);

    const questionsReceipt = await questionsTx.getReceipt(client);
    const newQuestionsTopicId = questionsReceipt.topicId;
    console.log(`✅ New Questions Topic ID: ${newQuestionsTopicId}\n`);

    // Create new Answers Topic (without submit key for public access)
    console.log("2. Creating new Answers Topic (public access)...");
    const answersTx = await new TopicCreateTransaction()
      .setTopicMemo("DevVault Answers - Public Access")
      .execute(client);

    const answersReceipt = await answersTx.getReceipt(client);
    const newAnswersTopicId = answersReceipt.topicId;
    console.log(`✅ New Answers Topic ID: ${newAnswersTopicId}\n`);

    console.log("🎉 Topics Fixed Successfully!");
    console.log("=============================\n");

    console.log("📝 UPDATE YOUR .env.local FILE WITH THESE NEW VALUES:\n");
    console.log(`VITE_QUESTIONS_TOPIC_ID=${newQuestionsTopicId}`);
    console.log(`VITE_ANSWERS_TOPIC_ID=${newAnswersTopicId}`);
    console.log("\n❌ OLD TOPIC IDs (with submit key restrictions):");
    console.log(`OLD VITE_QUESTIONS_TOPIC_ID=${process.env.VITE_QUESTIONS_TOPIC_ID}`);
    console.log(`OLD VITE_ANSWERS_TOPIC_ID=${process.env.VITE_ANSWERS_TOPIC_ID}`);
    console.log("\n⚠️  IMPORTANT: After updating .env.local, restart your dev server!");
    console.log("🚀 Users will now be able to ask questions and submit answers without signature errors.\n");

    client.close();
  } catch (error) {
    console.error("\n❌ Error fixing topics:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status?.toString(),
      name: error.name,
    });
    client.close();
    process.exit(1);
  }
}

fixTopics();
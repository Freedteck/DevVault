const {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

// Read .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const envContent = fs.readFileSync(envPath, "utf8");
  const env = {};

  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0 && !key.startsWith("#")) {
      let value = valueParts.join("=").trim();
      // Remove inline comments
      const commentIndex = value.indexOf("#");
      if (commentIndex > 0) {
        value = value.substring(0, commentIndex).trim();
      }
      if (value) {
        env[key.trim()] = value;
      }
    }
  });

  return env;
}

const env = loadEnv();

async function createNewTopics() {
  const myAccountId = AccountId.fromString(env.NEXT_PUBLIC_MY_ACCOUNT_ID);
  const myPrivateKey = PrivateKey.fromStringECDSA(env.NEXT_PUBLIC_MY_PRIVATE_KEY);

  const client = Client.forTestnet().setOperator(myAccountId, myPrivateKey);

  console.log("\n=======================================");
  console.log("Creating New HCS Topics for DevVault");
  console.log("=======================================\n");

  try {
    // Create Questions Topic
    console.log("1. Creating Questions Topic...");
    const questionsTx = await new TopicCreateTransaction()
      .setTopicMemo("DevVault Questions - Fresh Start")
      .setSubmitKey(myPrivateKey)
      .execute(client);

    const questionsReceipt = await questionsTx.getReceipt(client);
    const questionsTopicId = questionsReceipt.topicId;
    console.log(`✅ Questions Topic ID: ${questionsTopicId}\n`);

    // Create Answers Topic
    console.log("2. Creating Answers Topic...");
    const answersTx = await new TopicCreateTransaction()
      .setTopicMemo("DevVault Answers - Fresh Start")
      .setSubmitKey(myPrivateKey)
      .execute(client);

    const answersReceipt = await answersTx.getReceipt(client);
    const answersTopicId = answersReceipt.topicId;
    console.log(`✅ Answers Topic ID: ${answersTopicId}\n`);

    console.log("=======================================");
    console.log("✅ Topics Created Successfully!");
    console.log("=======================================\n");

    console.log("Update your .env.local file with:\n");
    console.log(`NEXT_PUBLIC_QUESTIONS_TOPIC_ID=${questionsTopicId}`);
    console.log(`NEXT_PUBLIC_ANSWERS_TOPIC_ID=${answersTopicId}`);
    console.log("\nOld topic IDs:");
    console.log(`OLD Questions: ${env.NEXT_PUBLIC_QUESTIONS_TOPIC_ID}`);
    console.log(`OLD Answers: ${env.NEXT_PUBLIC_ANSWERS_TOPIC_ID}`);
    console.log("\n=======================================\n");

    client.close();
  } catch (error) {
    console.error("\n❌ Error creating topics:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status?.toString(),
      name: error.name,
    });
    client.close();
    process.exit(1);
  }
}

createNewTopics();

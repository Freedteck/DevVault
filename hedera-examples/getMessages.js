import { Client } from "@hashgraph/sdk";
import { OPERATOR_ID, OPERATOR_KEY, TOPIC_ID } from "./constants.js";

// Load your operator credentials
const operatorId = OPERATOR_ID;
const operatorKey = OPERATOR_KEY;
const topicId = TOPIC_ID;

// Initialize your testnet client and set operator
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
// wait for Mirror Node to populate data
console.log("\nWaiting for Mirror Node to update...");
await new Promise((resolve) => setTimeout(resolve, 6000));

// query messages using Mirror Node
const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;

const response = await fetch(mirrorNodeUrl);
const data = await response.json();

if (data.messages && data.messages.length > 0) {
  const latestMessage = data.messages[data.messages.length - 1];
  const messageContent = Buffer.from(latestMessage.message, "base64")
    .toString("utf8")
    .trim();

  console.log(`\nLatest message: ${messageContent}\n`);
} else {
  console.log("No messages found yet in Mirror Node");
}

client.close();

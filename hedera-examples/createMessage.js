import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { OPERATOR_ID, OPERATOR_KEY, TOPIC_ID } from "./constants.js";

// Load your operator credentials
const operatorId = OPERATOR_ID;
const operatorKey = OPERATOR_KEY;
const topicId = TOPIC_ID;

// Initialize your testnet client and set operator
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
// Build & execute the message submission transaction
const message = "Hello, Hedera!";

const messageTransaction = new TopicMessageSubmitTransaction()
  .setTopicId(topicId)
  .setMessage(message);

await messageTransaction.execute(client);

console.log(`\nMessage submitted: ${message}\n`);

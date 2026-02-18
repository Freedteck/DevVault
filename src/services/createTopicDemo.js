// import { Client, TopicCreateTransaction } from "@hashgraph/sdk";
// import { OPERATOR_ID, OPERATOR_KEY } from "./constants.js";

// // Load your operator credentials
// const operatorId = OPERATOR_ID;
// const operatorKey = OPERATOR_KEY;

// // Initialize your testnet client and set operator
// const client = Client.forTestnet().setOperator(operatorId, operatorKey);
// // Build and send the transaction
// const txResponse = await new TopicCreateTransaction()
//   .setTopicMemo("Devvault Question Topic") // optional description
//   .execute(client);

// const receipt = await txResponse.getReceipt(client);
// const topicId = receipt.topicId;

// console.log(`\nTopic created: ${topicId.toString()}`);

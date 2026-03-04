/**
 * Vurso Admin: Post Official Announcement to HCS
 *
 * This script allows the platform operator to post high-priority
 * announcements to the dedicated Announcements HCS topic.
 *
 * It automatically creates a separate HCS discussion topic for each announcement
 * to allow for on-chain community comments.
 *
 * Usage:
 *   node scripts/post-announcement.mjs "Title" "Short Description" "Markdown Body" "optional-link"
 */

import {
  AccountId,
  PrivateKey,
  Client,
  TopicMessageSubmitTransaction,
  TopicCreateTransaction,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");

dotenv.config({ path: envPath });

async function main() {
  const operatorIdStr = process.env.OPERATOR_ACCOUNT_ID;
  const operatorKeyStr = process.env.OPERATOR_PRIVATE_KEY;
  const adminTopicId = process.env.NEXT_PUBLIC_ANNOUNCEMENTS_TOPIC_ID;

  const title = process.argv[2] || "Hedera Apex 2026 Hackathon Live!";
  const shortDescription =
    process.argv[3] ||
    "Submit your projects to the Legacy Builders track by March 15th.";
  const body =
    process.argv[4] ||
    "The Hedera Apex 2026 Hackathon is officially live. This year we are focusing on sustainable growth and community-driven development. Join over 5,000 developers competing for $200k in HBAR prizes.\n\n### Tracks\n- Legacy Builders ($50k)\n- DeFi Masters ($50k)\n- AI Integration ($50k)\n- Social Impact ($50k)";
  const link = process.argv[5] || "https://hedera.com/apex-2026";
  const linkText = "Official Site";

  if (!operatorIdStr || !operatorKeyStr) {
    console.error(
      "❌ ERROR: Set OPERATOR_ACCOUNT_ID and OPERATOR_PRIVATE_KEY in .env.local",
    );
    process.exit(1);
  }
  if (!adminTopicId) {
    console.error(
      "❌ ERROR: NEXT_PUBLIC_ANNOUNCEMENTS_TOPIC_ID not found in .env.local",
    );
    process.exit(1);
  }

  const operatorId = AccountId.fromString(operatorIdStr);
  let operatorKey;
  try {
    if (operatorKeyStr.startsWith("0x")) {
      operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr.slice(2));
    } else {
      operatorKey = PrivateKey.fromStringDer(operatorKeyStr);
    }
  } catch {
    operatorKey = PrivateKey.fromString(operatorKeyStr);
  }

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  console.log("🛠️ Preparing new announcement...");

  try {
    // 1. Create a dedicated discussion topic for community comments
    console.log("📡 Creating discussion topic...");
    const topicCreateTx = await new TopicCreateTransaction().execute(client);
    const topicCreateReceipt = await topicCreateTx.getReceipt(client);
    const discussionTopicId = topicCreateReceipt.topicId.toString();
    console.log(`✅ Discussion Topic Created: ${discussionTopicId}`);

    // 2. Prepare the payload
    const payload = {
      type: "ANNOUNCEMENT",
      title,
      shortDescription,
      body,
      author: {
        accountId: operatorIdStr,
        displayName: "Vurso Admin",
      },
      discussionTopicId,
      link,
      linkText,
      timestamp: Date.now(),
    };

    // 3. Post to the main announcements/updates topic
    console.log(`📢 Posting to ${adminTopicId}...`);
    const submitTx = await new TopicMessageSubmitTransaction({
      topicId: adminTopicId,
      message: JSON.stringify(payload),
    }).execute(client);

    const receipt = await submitTx.getReceipt(client);
    console.log(
      `🎉 Success! Announcement sequence number: ${receipt.topicSequenceNumber}`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

main();

import {
  AccountId,
  PrivateKey,
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TopicCreateTransaction,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");

dotenv.config({ path: envPath });

async function main() {
  const operatorIdStr = process.env.OPERATOR_ACCOUNT_ID;
  const operatorKeyStr = process.env.OPERATOR_PRIVATE_KEY;

  if (!operatorIdStr || !operatorKeyStr || operatorIdStr.includes("xxxxx")) {
    console.error(
      "❌ ERROR: Please set OPERATOR_ACCOUNT_ID and OPERATOR_PRIVATE_KEY in .env.local",
    );
    process.exit(1);
  }

  const operatorId = AccountId.fromString(operatorIdStr);

  // Smart key parser: handles DER-encoded, '0x' ECDSA hex, and plain hex formats
  let operatorKey;
  try {
    if (operatorKeyStr.startsWith("0x")) {
      // 0x-prefixed = ECDSA key (MetaMask/EVM-style Hedera account)
      operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr.slice(2));
    } else {
      operatorKey = PrivateKey.fromStringDer(operatorKeyStr);
    }
  } catch {
    try {
      operatorKey = PrivateKey.fromStringED25519(operatorKeyStr);
    } catch {
      operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr);
    }
  }
  console.log(`🔑 Key type detected: ${operatorKey.type}`);

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  console.log("🚀 Starting Hedera Infrastructure Setup...");
  const envUpdates = {};

  try {
    // 1. Create Vurso Token (VRS)
    console.log("\n🪙 Creating Vurso Token (VRS)...");
    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName("Vurso Token")
      .setTokenSymbol("VRS")
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2)
      .setInitialSupply(100000000) // 1,000,000.00 VRS
      .setTreasuryAccountId(operatorId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(operatorKey)
      .setAdminKey(operatorKey)
      .freezeWith(client);

    const tokenCreateSign = await tokenCreateTx.sign(operatorKey);
    const tokenCreateSubmit = await tokenCreateSign.execute(client);
    const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateRx.tokenId;
    console.log(`✅ VRS Token Created! ID: ${tokenId}`);
    envUpdates["NEXT_PUBLIC_VRS_TOKEN_ID"] = tokenId.toString();

    // 2. Create Registry Topic
    console.log("\n📚 Creating Registry Topic...");
    const registryTx = await new TopicCreateTransaction().execute(client);
    const registryRx = await registryTx.getReceipt(client);
    console.log(`✅ Registry Topic Created! ID: ${registryRx.topicId}`);
    envUpdates["NEXT_PUBLIC_REGISTRY_TOPIC_ID"] = registryRx.topicId.toString();

    // 3. Create Questions Topic
    console.log("\n❓ Creating Questions Topic...");
    const questionsTx = await new TopicCreateTransaction().execute(client);
    const questionsRx = await questionsTx.getReceipt(client);
    console.log(`✅ Questions Topic Created! ID: ${questionsRx.topicId}`);
    envUpdates["NEXT_PUBLIC_QUESTIONS_TOPIC_ID"] =
      questionsRx.topicId.toString();

    // 4. Create Updates Topic
    console.log("\n📰 Creating Updates Topic...");
    const updatesTx = await new TopicCreateTransaction().execute(client);
    const updatesRx = await updatesTx.getReceipt(client);
    console.log(`✅ Updates Topic Created! ID: ${updatesRx.topicId}`);
    envUpdates["NEXT_PUBLIC_UPDATES_TOPIC_ID"] = updatesRx.topicId.toString();

    // 5. Update .env.local
    console.log("\n💾 Updating .env.local...");
    let envContent = fs.readFileSync(envPath, "utf-8");

    for (const [key, value] of Object.entries(envUpdates)) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env.local updated successfully!");
    console.log("\n🎉 Infrastructure Setup Complete!");
  } catch (error) {
    console.error("❌ Setup Failed:", error);
  } finally {
    process.exit(0);
  }
}

main();

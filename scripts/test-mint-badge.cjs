const {
  Client,
  AccountId,
  PrivateKey,
  TokenMintTransaction,
  TokenFreezeTransaction,
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

async function testMintBadge() {
  const myAccountId = AccountId.fromString(env.VITE_MY_ACCOUNT_ID);
  const myPrivateKey = PrivateKey.fromStringECDSA(env.VITE_MY_PRIVATE_KEY);
  const userAccountId = AccountId.fromString("0.0.4612578");
  const nftCollectionId = env.VITE_NFT_BADGE_COLLECTION_ID;

  const client = Client.forTestnet().setOperator(myAccountId, myPrivateKey);

  console.log("\n=======================================");
  console.log("Testing Badge Minting");
  console.log("=======================================");
  console.log(`Treasury Account: ${myAccountId}`);
  console.log(`User Account: ${userAccountId}`);
  console.log(`NFT Collection: ${nftCollectionId}`);
  console.log("");

  try {
    // Step 1: Create minimal metadata (100 bytes max for Hedera NFTs)
    console.log("Step 1: Creating NFT metadata...");
    const metadata = Buffer.from(
      JSON.stringify({
        tier: "Helper",
        acc: 1,
      })
    );

    console.log(`✅ Metadata created (${metadata.length} bytes)`);

    if (metadata.length > 100) {
      throw new Error(`Metadata too large: ${metadata.length} bytes (max 100)`);
    }

    // Step 2: Mint NFT to treasury (will transfer later)
    console.log("\nStep 2: Minting NFT...");
    const mintTx = await new TokenMintTransaction()
      .setTokenId(nftCollectionId)
      .setMetadata([metadata])
      .freezeWith(client);

    const mintTxSigned = await mintTx.sign(myPrivateKey);
    const mintSubmit = await mintTxSigned.execute(client);
    const mintRx = await mintSubmit.getReceipt(client);

    console.log(`✅ NFT Minted: ${mintRx.status}`);
    console.log(`Serial Number: ${mintRx.serials[0]}`);

    console.log("\n=======================================");
    console.log("✅ BADGE MINTING SUCCESSFUL!");
    console.log("=======================================");
    console.log(`Serial Number: ${mintRx.serials[0]}`);
    console.log(`Transaction ID: ${mintSubmit.transactionId}`);
    console.log(
      `View on HashScan: https://hashscan.io/testnet/transaction/${mintSubmit.transactionId}`
    );
    console.log("\nNOTE: Badge is now in treasury. To complete the flow:");
    console.log("1. User associates token via wallet");
    console.log("2. Transfer NFT from treasury to user");
    console.log("3. Freeze user's account to make badge soulbound");
    console.log("");

    client.close();
  } catch (error) {
    console.error("\n❌ Error during badge minting:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status?.toString(),
      name: error.name,
    });
    client.close();
    process.exit(1);
  }
}

testMintBadge();

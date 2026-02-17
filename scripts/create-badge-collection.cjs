const {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
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
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/^#.*/, "").trim();
      if (value && !key.startsWith("#")) {
        env[key.trim()] = value;
      }
    }
  });
  
  return env;
}

const env = loadEnv();

async function createBadgeCollection() {
  const accountId = AccountId.fromString(env.VITE_MY_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(env.VITE_MY_PRIVATE_KEY);

  const client = Client.forTestnet().setOperator(accountId, privateKey);

  console.log("\n=======================================");
  console.log("Creating DevVault Badge NFT Collection...");
  console.log("=======================================\n");

  try {
    // Create NFT collection with proper keys
    const nftCreate = await new TokenCreateTransaction()
      .setTokenName("DevVault Achievement Badges")
      .setTokenSymbol("DVBADGE")
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(accountId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(privateKey) // Required for minting
      .setFreezeKey(privateKey) // Required for soulbound (freezing transfers)
      .setFreezeDefault(false) // Don't freeze by default, we'll freeze after mint
      .setMaxTransactionFee(20)
      .execute(client);

    const nftCreateRx = await nftCreate.getReceipt(client);
    const tokenId = nftCreateRx.tokenId;

    console.log("✅ Badge Collection Created!");
    console.log(`Token ID: ${tokenId}`);
    console.log(`Treasury: ${accountId}`);
    console.log("\nUpdate your .env.local with:");
    console.log(`VITE_NFT_BADGE_COLLECTION_ID=${tokenId}`);
    console.log("\n=======================================\n");

    client.close();
    return tokenId;
  } catch (error) {
    console.error("❌ Failed to create badge collection:", error);
    client.close();
    throw error;
  }
}

createBadgeCollection();

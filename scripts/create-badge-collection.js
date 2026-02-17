/* eslint-env node */
const {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
} = require("@hashgraph/sdk");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

async function createBadgeCollection() {
  const accountId = AccountId.fromString(process.env.VITE_MY_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(
    process.env.VITE_MY_PRIVATE_KEY
  );

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

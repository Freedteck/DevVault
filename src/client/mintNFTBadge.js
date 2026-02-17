import {
  TokenMintTransaction,
  TokenAssociateTransaction,
} from "@hashgraph/sdk";

async function mintNFTBadge(walletData, accountId, nftCollectionId, badgeData) {
  console.log(`\n=======================================`);
  console.log(`- Minting ${badgeData.tier} badge NFT...`);

  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId
  );
  const signer = hashconnect.getSigner(provider);

  // Check if user has associated with the NFT collection
  // If not, associate first
  try {
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([nftCollectionId])
      .freezeWithSigner(signer);

    await associateTx.executeWithSigner(signer);
    console.log(`- Token association successful`);
  } catch (error) {
    // If already associated, this will fail - that's okay
    console.log(
      `- Token already associated or association failed:`,
      error.message
    );
  }

  // Create metadata for the NFT
  const metadata = JSON.stringify({
    name: `DevVault ${badgeData.tier} Badge`,
    description: `Earned ${badgeData.required} accepted answers on DevVault`,
    tier: badgeData.tier,
    required: badgeData.required,
    earned: badgeData.earned,
    earnedDate: new Date(badgeData.timestamp).toISOString(),
  });

  // Convert metadata to Uint8Array
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadata);

  // Mint the NFT
  const mintTx = await new TokenMintTransaction()
    .setTokenId(nftCollectionId)
    .setMetadata([metadataBytes])
    .freezeWithSigner(signer);

  const mintSubmit = await mintTx.executeWithSigner(signer);
  const mintRx = await provider.getTransactionReceipt(mintSubmit.transactionId);

  const status = mintRx.status;
  console.log(`✅ NFT Badge minted: ${status}`);
  console.log(`Transaction ID: ${mintSubmit.transactionId}`);

  return [status, mintSubmit.transactionId];
}

export default mintNFTBadge;

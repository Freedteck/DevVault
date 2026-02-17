import {
  TokenMintTransaction,
  TokenAssociateTransaction,
  TokenFreezeTransaction,
  TransferTransaction,
  AccountId,
  TokenId,
  NftId,
  PrivateKey,
  Client,
} from "@hashgraph/sdk";

/**
 * Check if user is already associated with a token
 */
async function isTokenAssociated(accountId, tokenId) {
  try {
    const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.tokens && data.tokens.length > 0;
  } catch (error) {
    console.warn("Error checking token association:", error);
    return false;
  }
}

async function mintNFTBadge(walletData, accountId, nftCollectionId, badgeData) {
  console.log("\n=======================================");
  console.log(`Minting ${badgeData.tier} badge NFT...`);

  try {
    const hashconnect = walletData[0];
    const saveData = walletData[1];
    const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
    const signer = hashconnect.getSigner(provider);

    const treasuryAccountId = import.meta.env.VITE_MY_ACCOUNT_ID;
    const supplyKey = PrivateKey.fromStringECDSA(import.meta.env.VITE_MY_PRIVATE_KEY);

    const treasuryClient = Client.forTestnet().setOperator(
      AccountId.fromString(treasuryAccountId),
      supplyKey
    );

    console.log("User Account:", accountId);
    console.log("Collection:", nftCollectionId);

    // Step 1: Check and associate token if needed
    console.log("\n1. Checking token association...");
    const isAssociated = await isTokenAssociated(accountId, nftCollectionId);
    
    if (!isAssociated) {
      console.log("Token not associated. Associating now...");
      try {
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(accountId)
          .setTokenIds([nftCollectionId])
          .freezeWithSigner(signer);

        const associateResponse = await associateTx.executeWithSigner(signer);
        const associateTxId = associateResponse.transactionId;
        console.log("Association transaction submitted:", associateTxId.toString());
        
        // Wait for receipt using provider
        const associateReceipt = await provider.getTransactionReceipt(associateTxId);
        console.log("Token associated:", associateReceipt.status.toString());
      } catch (error) {
        console.error("Association failed:", error);
        throw new Error(`Failed to associate token: ${error.message}`);
      }
    } else {
      console.log("✓ Token already associated");
    }

    // Step 2: Create metadata
    console.log("\n2. Creating metadata...");
    const metadata = {
      t: badgeData.tier,
      a: badgeData.earned,
      d: Date.now(),
    };

    const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
    console.log("Metadata size:", metadataBytes.length, "bytes");

    // Step 3: Mint to treasury
    console.log("\n3. Minting NFT...");
    const mintTx = await new TokenMintTransaction()
      .setTokenId(nftCollectionId)
      .setMetadata([metadataBytes])
      .freezeWith(treasuryClient);

    const signedMintTx = await mintTx.sign(supplyKey);
    const mintResponse = await signedMintTx.execute(treasuryClient);
    const mintRx = await mintResponse.getReceipt(treasuryClient);

    const serialNumber = mintRx.serials[0];
    console.log("NFT Minted! Serial:", serialNumber.toString());

    // Step 4: Transfer to user
    console.log("\n4. Transferring badge...");
    const nftId = new NftId(TokenId.fromString(nftCollectionId), serialNumber);

    const transferTx = await new TransferTransaction()
      .addNftTransfer(nftId, AccountId.fromString(treasuryAccountId), AccountId.fromString(accountId))
      .freezeWithSigner(signer);

    const transferTxSigned = await transferTx.sign(supplyKey);
    const transferResponse = await transferTxSigned.executeWithSigner(signer);
    const transferTxId = transferResponse.transactionId;
    console.log("Transfer transaction submitted:", transferTxId.toString());
    
    // Wait for receipt using provider
    const transferReceipt = await provider.getTransactionReceipt(transferTxId);
    console.log("Badge transferred:", transferReceipt.status.toString());

    // Step 5: Freeze (make soulbound)
    console.log("\n5. Making soulbound...");
    const freezeTx = await new TokenFreezeTransaction()
      .setTokenId(nftCollectionId)
      .setAccountId(accountId)
      .freezeWith(treasuryClient);

    const signedFreezeTx = await freezeTx.sign(supplyKey);
    const freezeResponse = await signedFreezeTx.execute(treasuryClient);
    const freezeRx = await freezeResponse.getReceipt(treasuryClient);

    console.log("Badge frozen:", freezeRx.status.toString());

    treasuryClient.close();

    console.log("\n=======DONE========");
    console.log("Serial:", serialNumber.toString());
    console.log("View: https://hashscan.io/testnet/token/" + nftCollectionId + "/" + serialNumber);

    return {
      success: true,
      serialNumber: serialNumber.toString(),
      transactionId: mintResponse.transactionId.toString(),
    };
  } catch (error) {
    console.error("\n❌ Error during badge minting:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status?.toString(),
      name: error.name,
    });
    throw error;
  }
}

export { mintNFTBadge };

import { TokenAssociateTransaction } from "@hashgraph/sdk";

/**
 * Check if user is already associated with a token
 */
export async function isTokenAssociated(accountId, tokenId) {
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

/**
 * Associate a token with the user's account
 */
export async function associateToken(walletData, accountId, tokenId) {
  const hashconnect = walletData[0];
  const saveData = walletData[1];

  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId
  );
  const signer = hashconnect.getSigner(provider);

  try {
    const associateUserTx = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWithSigner(signer);

    // Submit the transaction
    const tokenAssociateSubmit = await associateUserTx.executeWithSigner(signer);

    const tokenAssociateRx = await provider.getTransactionReceipt(
      tokenAssociateSubmit.transactionId
    );

    if (tokenAssociateRx.status.toString() !== "SUCCESS") {
      throw new Error(
        `Token association failed with status: ${tokenAssociateRx.status}`
      );
    }

    return { success: true, status: tokenAssociateRx.status.toString() };
  } catch (error) {
    console.error(`Error during token association: ${error.message}`);
    throw error;
  }
}
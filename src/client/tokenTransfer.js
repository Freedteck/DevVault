import { TokenAssociateTransaction, TransferTransaction } from "@hashgraph/sdk";

async function tokenTransferFcn(
  walletData,
  senderAccountId,
  receiverAccountId,
  amount,
  tokenId
) {
  console.log(`\n=======================================`);
  console.log(`- Transferring ${amount} tokens...`);

  const hashconnect = walletData[0];
  const saveData = walletData[1];

  const providerSender = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    senderAccountId
  );
  const signerSender = hashconnect.getSigner(providerSender);

  const providerReceiver = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    receiverAccountId
  );
  const signerReceiver = hashconnect.getSigner(providerReceiver);

  // Check if the token is associated with the receiver's account
  const checkAssociation = async () => {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${receiverAccountId}/tokens`
      );
      const data = await response.json();

      const tokenAssociations = data.tokens || [];
      const isAssociated = tokenAssociations.some(
        (association) => association.token_id === tokenId
      );

      console.log(
        isAssociated
          ? `Token ${tokenId} is associated with account ${receiverAccountId}`
          : `Token ${tokenId} is NOT associated with account ${receiverAccountId}`
      );

      return isAssociated;
    } catch (error) {
      console.error("Error checking token association:", error);
      return false; // Assume not associated in case of error
    }
  };

  const isAssociated = await checkAssociation();

  // Associate token with receiver's account if not already associated
  if (!isAssociated) {
    const associate = async () => {
      try {
        const associateUserTx = await new TokenAssociateTransaction()
          .setAccountId(receiverAccountId)
          .setTokenIds([tokenId])
          .freezeWithSigner(signerReceiver);

        // Submit the transaction
        const tokenAssociateSubmit =
          await associateUserTx.executeWithSigner(signerReceiver);

        const tokenAssociateRx = await providerReceiver.getTransactionReceipt(
          tokenAssociateSubmit.transactionId
        );

        // Log the transaction status
        console.log(
          `- Token association with receiver's account: ${tokenAssociateRx.status} \n`
        );

        if (tokenAssociateRx.status.toString() !== "SUCCESS") {
          throw new Error(
            `Token association failed with status: ${tokenAssociateRx.status}`
          );
        }
      } catch (error) {
        console.error(`Error during token association: ${error.message}`);
        throw error;
      }
    };

    await associate();
  } else {
    // Ensure the amount is a number
    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      console.error("Invalid transfer amount.");
      return;
    }

    const tokenTransferTx = await new TransferTransaction()
      .addTokenTransfer(tokenId, senderAccountId, -transferAmount)
      .addTokenTransfer(tokenId, receiverAccountId, transferAmount)
      .freezeWithSigner(signerSender);

    const tokenTransferSubmit =
      await tokenTransferTx.executeWithSigner(signerSender);
    const tokenTransferRx = await providerSender.getTransactionReceipt(
      tokenTransferSubmit.transactionId
    );
    const status = tokenTransferRx.status;
    console.log(`- Tokens transferred: ${status}`);

    return [status, tokenTransferSubmit.transactionId];
  }
}

export default tokenTransferFcn;

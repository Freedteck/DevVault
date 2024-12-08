import { Hbar, TransferTransaction } from "@hashgraph/sdk";

async function hbarTransfer(
  walletData,
  senderAccountId,
  receiverAccountId,
  amount
) {
  console.log(`\n=======================================`);
  console.log(`- Transferring ${amount} Hbars...`);

  const hashconnect = walletData[0];
  const saveData = walletData[1];

  const providerSender = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    senderAccountId
  );
  const signerSender = hashconnect.getSigner(providerSender);

  // Convert amount to tinybars (if amount is in HBAR)
  const amountInTinybars = Hbar.from(amount).toTinybars();

  const sendHbar = await new TransferTransaction()
    .addHbarTransfer(senderAccountId, Hbar.fromTinybars(-amountInTinybars)) //Sending account
    .addHbarTransfer(receiverAccountId, Hbar.fromTinybars(amountInTinybars)) //Receiving account
    .freezeWithSigner(signerSender);

  const tokenTransferSubmit = await sendHbar.executeWithSigner(signerSender);
  const tokenTransferRx = await providerSender.getTransactionReceipt(
    tokenTransferSubmit.transactionId
  );
  const status = tokenTransferRx.status;
  console.log(`- Tokens transferred: ${status}`);

  return [status];
}

export default hbarTransfer;

import { DAppConnector } from "@hashgraph/hedera-wallet-connect";
import {
  AccountId,
  TokenAssociateTransaction,
  TokenId,
  TransferTransaction,
} from "@hashgraph/sdk";

export const WalletConnectClient = (dappConnector: DAppConnector) => {
  const signer = dappConnector.signers[0];
  const accountId = signer?.getAccountId().toString();

  const transferHBAR = async (toAddress: AccountId, amount: number) => {
    const transferHBARTransaction = new TransferTransaction()
      .addHbarTransfer(accountId, -amount)
      .addHbarTransfer(toAddress, amount);

    await transferHBARTransaction.freezeWithSigner(signer);
    const txResult = await transferHBARTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  };

  const transferFungibleToken = async (
    toAddress: AccountId,
    tokenId: TokenId,
    amount: number
  ) => {
    const transferTokenTransaction = new TransferTransaction()
      .addTokenTransfer(tokenId, accountId, -amount)
      .addTokenTransfer(tokenId, toAddress.toString(), amount);

    await transferTokenTransaction.freezeWithSigner(signer);
    const txResult = await transferTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  };

  const transferNonFungibleToken = async (
    toAddress: AccountId,
    tokenId: TokenId,
    serialNumber: number
  ) => {
    const transferTokenTransaction = new TransferTransaction().addNftTransfer(
      tokenId,
      serialNumber,
      accountId,
      toAddress
    );

    await transferTokenTransaction.freezeWithSigner(signer);
    const txResult = await transferTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  };

  const associateToken = async (tokenId: TokenId) => {
    const associateTokenTransaction = new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId]);

    await associateTokenTransaction.freezeWithSigner(signer);
    const txResult = await associateTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  };

  return {
    transferHBAR,
    transferFungibleToken,
    transferNonFungibleToken,
    associateToken,
  };
};

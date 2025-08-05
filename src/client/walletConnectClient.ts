import {
  AccountBalanceQuery,
  AccountId,
  Hbar,
  PublicKey,
  TokenAssociateTransaction,
  TokenCreateTransaction,
  TokenId,
  TokenSupplyType,
  TokenType,
  TopicCreateTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
  TransferTransaction,
} from "@hashgraph/sdk";
import walletConnectFcn from "./walletConnect";

const TOPIC_ID = import.meta.env.VITE_TOPIC_ID;
const TOKEN_ID = import.meta.env.VITE_TOKEN_ID;

export const WalletConnectClient = async () => {
  const { dappConnector } = await walletConnectFcn();
  const signer = dappConnector.signers[0];
  const accountId = signer?.getAccountId().toString();

  const isTokenAssociated = async (
    accountIdToCheck: string,
    tokenId: string = TOKEN_ID,
  ): Promise<boolean> => {
    try {
      const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountIdToCheck}/tokens?limit=100`;
      const response = await fetch(url);
      const data = await response.json();

      // If the account has the token, it will be in the tokens array
      const tokenAssociations = data.tokens || [];
      const isAssociated = tokenAssociations.some(
        (association: { token_id: string }) => association.token_id === tokenId
      );
      return isAssociated;
    } catch (error) {
      console.error("Error checking token association:", error);
      return false;
    }
  };

  // Associate token if not already associated
  const ensureTokenAssociation = async (
    targetAccountId: string,
    tokenId: string = TOKEN_ID
  ) => {
    const isAssociated = await isTokenAssociated(targetAccountId, tokenId);

    if (!isAssociated) {
      console.log(
        `Token ${tokenId.toString()} not associated with account ${targetAccountId}. Associating...`
      );

      // Note: This will only work if the signer has the authority to associate tokens
      // for the target account, or if the target account is the same as the signer's account
      const associateTokenTransaction = new TokenAssociateTransaction()
        .setAccountId(targetAccountId)
        .setTokenIds([tokenId]);

      await associateTokenTransaction.freezeWithSigner(signer);
      const txResult = await associateTokenTransaction.executeWithSigner(
        signer
      );

      if (txResult) {
        console.log(
          `Token ${tokenId.toString()} successfully associated with account ${targetAccountId}`
        );
        return txResult.transactionId;
      }
    } else {
      console.log(
        `Token ${tokenId.toString()} already associated with account ${targetAccountId}`
      );
    }

    return null;
  };

  // Transfer HBAR
  const transferHBAR = async (toAddress: AccountId, amount: number) => {
    const transferHBARTransaction = new TransferTransaction()
      .addHbarTransfer(accountId, -amount)
      .addHbarTransfer(toAddress, amount);

    await transferHBARTransaction.freezeWithSigner(signer);
    const txResult = await transferHBARTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  };

  // Transfer Fungible Token with automatic association check
  const transferFungibleToken = async (
    toAddress: AccountId,
    amount: number,
    tokenId: any = TOKEN_ID
  ) => {
    // Check and associate token for recipient if needed
    await ensureTokenAssociation(toAddress.toString(), tokenId);

    const transferTokenTransaction = await new TransferTransaction()
      .addTokenTransfer(tokenId, accountId, -amount)
      .addTokenTransfer(tokenId, toAddress.toString(), amount)
      .freezeWithSigner(signer);
    const txResult = await transferTokenTransaction.executeWithSigner(signer);
    const receipt = await txResult.getReceiptWithSigner(signer);
    console.log("Status", receipt.status.toString());

    return receipt.status.toString();
  };

  // Transfer Non-Fungible Token with automatic association check
  const transferNonFungibleToken = async (
    toAddress: AccountId,
    tokenId: any,
    serialNumber: number
  ) => {
    // Check and associate token for recipient if needed
    await ensureTokenAssociation(toAddress.toString(), tokenId);

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

  // Associate Token (existing function)
  const associateToken = async (tokenId: TokenId = TOKEN_ID) => {
    const associateTokenTransaction = new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId]);

    await associateTokenTransaction.freezeWithSigner(signer);
    const txResult = await associateTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  };

  // Create Topic
  const createTopic = async () => {
    const createTopicTransaction =
      await new TopicCreateTransaction().freezeWithSigner(signer);

    const topicCreateSubmit = await createTopicTransaction.executeWithSigner(
      signer
    );
    const txResult = await topicCreateSubmit.getReceiptWithSigner(signer);
    console.log("Topic created with ID:", txResult.topicId.toString());

    return txResult ? txResult.topicId : null;
  };

  // create Topic Message
  const createTopicMessage = async (
    message: any,
    topicId: TopicId = TOPIC_ID
  ) => {
    if (!topicId) {
      throw new Error("Topic ID is not defined in environment variables");
    }
    const messageString = JSON.stringify(message);
    const topicMessageTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(messageString)
      .freezeWithSigner(signer);

    const txResult = await topicMessageTx.executeWithSigner(signer);
    const receipt = await txResult.getReceiptWithSigner(signer);
    console.log("Message submitted to topic:", receipt.status);

    return receipt.status.toString();
  };

  const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts?account.id=${accountId}`;
  const mirrorQuery = await fetch(url).then((res) => res.json());
  const supplyKey = PublicKey.fromString(mirrorQuery?.accounts[0].key.key);
  // Function to create the NFT collection (user profile collection)
  const createProfileNftCollection = async () => {
    const nftCreateTx = await new TokenCreateTransaction()
      .setTokenName("User Profile Collection")
      .setTokenSymbol("PROFILE")
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(accountId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(supplyKey)
      .setMaxTransactionFee(new Hbar(20))
      .freezeWithSigner(signer);

    const nftCreateTxSign = await nftCreateTx.signWithSigner(signer);
    const nftCreateSubmit = await nftCreateTxSign.executeWithSigner(signer);
    const nftCreateRx = await nftCreateSubmit.getReceiptWithSigner(signer);
    const tokenId = nftCreateRx.tokenId;
    console.log("NFT Collection created with ID:", tokenId.toString());
    return tokenId;
  };

  return {
    transferHBAR,
    transferFungibleToken,
    transferNonFungibleToken,
    associateToken,
    createTopic,
    createTopicMessage,
    createProfileNftCollection,
    isTokenAssociated,
    ensureTokenAssociation,
    
  };
};

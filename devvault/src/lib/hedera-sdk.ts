import {
  Client,
  AccountId,
  PrivateKey,
  TopicMessageSubmitTransaction,
  TopicCreateTransaction,
  TransferTransaction,
  Hbar,
  TokenAssociateTransaction,
  TokenId,
} from "@hashgraph/sdk";

// IMPORTANT: This module is server-only. Do NOT import into client components.
// It requires OPERATOR_PRIVATE_KEY which must never reach the browser.

function getClient(): Client {
  const operatorId = process.env.OPERATOR_ACCOUNT_ID;
  const operatorKey = process.env.OPERATOR_PRIVATE_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error(
      "OPERATOR_ACCOUNT_ID and OPERATOR_PRIVATE_KEY must be set in .env.local",
    );
  }

  let key: PrivateKey;
  if (operatorKey.startsWith("0x")) {
    key = PrivateKey.fromStringECDSA(operatorKey.slice(2));
  } else {
    try {
      key = PrivateKey.fromStringDer(operatorKey);
    } catch {
      key = PrivateKey.fromStringED25519(operatorKey);
    }
  }

  return Client.forTestnet().setOperator(AccountId.fromString(operatorId), key);
}

/**
 * Submit a structured JSON message to an HCS topic.
 */
export async function submitHCSMessage(
  topicId: string,
  payload: Record<string, unknown>,
): Promise<{ transactionId: string; sequenceNumber?: number }> {
  const client = getClient();
  const message = JSON.stringify(payload);

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  return {
    transactionId: tx.transactionId?.toString() ?? "",
    sequenceNumber: receipt.topicSequenceNumber?.toNumber(),
  };
}

/**
 * Create a new HCS topic (e.g., per-question discussion topic).
 * Returns the new topic ID as a string.
 */
export async function createDiscussionTopic(): Promise<string> {
  const client = getClient();
  const tx = await new TopicCreateTransaction().execute(client);
  const receipt = await tx.getReceipt(client);
  return receipt.topicId!.toString();
}

/**
 * Transfer HBAR from the operator to a recipient.
 * Used for tipping or bounty releases.
 */
export async function transferHBAR(
  toAccountId: string,
  amountHbar: number,
): Promise<string> {
  const client = getClient();
  const operatorId = process.env.OPERATOR_ACCOUNT_ID!;

  const tx = await new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(operatorId), new Hbar(-amountHbar))
    .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amountHbar))
    .execute(client);

  const receipt = await tx.getReceipt(client);
  return tx.transactionId?.toString() ?? "";
}

/**
 * Associate the DVT token with an account so it can receive DVT.
 * Needs the account's private key — only for server-side flows.
 */
export async function associateDVTToken(
  accountId: string,
  accountPrivateKey: string,
): Promise<void> {
  const client = getClient();
  const tokenId = TokenId.fromString(process.env.NEXT_PUBLIC_DVT_TOKEN_ID!);
  const accId = AccountId.fromString(accountId);

  let key: PrivateKey;
  if (accountPrivateKey.startsWith("0x")) {
    key = PrivateKey.fromStringECDSA(accountPrivateKey.slice(2));
  } else {
    key = PrivateKey.fromStringED25519(accountPrivateKey);
  }

  const tx = await new TokenAssociateTransaction()
    .setAccountId(accId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(key);

  await (await tx.execute(client)).getReceipt(client);
}

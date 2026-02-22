import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  AccountId,
  Hbar,
  ContractId,
  Client,
} from "@hashgraph/sdk";

/**
 * Escrow Service - Handles bounty escrow operations
 */

interface EscrowTxResult {
  status: string;
  transactionId: any;
}

/**
 * Deposit bounty to escrow contract
 * @param dAppConnector - DAppConnector instance
 * @param accountId - User's account ID
 * @param contractId - Escrow contract ID
 * @param questionId - Question ID (used as key in escrow mapping)
 * @param amount - Amount in HBAR
 * @returns - { status, transactionId }
 */
export async function depositBountyToEscrow(
  dAppConnector: any,
  accountId: string,
  contractId: string,
  questionId: string,
  amount: number,
): Promise<EscrowTxResult> {
  console.log(`💰 Depositing ${amount} HBAR to escrow for ${questionId}...`);

  const signer = dAppConnector.getSigner(AccountId.fromString(accountId));

  // Convert questionId string to uint256 (use timestamp portion as numeric ID)
  const numericQuestionId = parseInt(questionId.split("-")[1]);

  // Create contract execution transaction
  const contractExecTx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(200000)
    .setFunction(
      "deposit",
      new ContractFunctionParameters().addUint256(numericQuestionId),
    )
    .setPayableAmount(new Hbar(amount));

  // Execute via DAppConnector signer
  const txResponse = await signer.call(contractExecTx);

  console.log(`✅ Escrow deposit successful`);

  return {
    status: txResponse.status?.toString() || "SUCCESS",
    transactionId: txResponse.transactionId || txResponse,
  };
}

/**
 * Release escrow funds to recipient
 * @param dAppConnector - DAppConnector instance
 * @param accountId - User's account ID (must be depositor or contract owner)
 * @param contractId - Escrow contract ID
 * @param questionId - Question ID
 * @param recipientId - Recipient account ID
 * @returns - { status, transactionId }
 */
export async function releaseEscrow(
  dAppConnector: any,
  accountId: string,
  contractId: string,
  questionId: string,
  recipientId: string,
): Promise<EscrowTxResult> {
  console.log(`🔓 Releasing escrow for ${questionId} to ${recipientId}...`);
  console.log(`   Contract: ${contractId}`);
  console.log(`   Caller: ${accountId}`);

  const signer = dAppConnector.getSigner(AccountId.fromString(accountId));
  const numericQuestionId = parseInt(questionId.split("-")[1]);
  console.log(`   Numeric Question ID: ${numericQuestionId}`);

  // Get the actual EVM address from mirror node
  const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${recipientId}`;
  const accountResponse = await fetch(mirrorNodeUrl);
  const accountData = await accountResponse.json();
  const recipientAddress = accountData.evm_address;

  console.log(`   Recipient Account: ${recipientId}`);
  console.log(`   Recipient Address (EVM long-form): ${recipientAddress}`);

  const contractExecTx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(300000) // Increased gas
    .setFunction(
      "release",
      new ContractFunctionParameters()
        .addUint256(numericQuestionId)
        .addAddress(recipientAddress),
    );

  console.log(
    `   Full transaction params: questionId=${numericQuestionId}, recipient=${recipientAddress}`,
  );

  try {
    const txResponse = await signer.call(contractExecTx);
    console.log(`✅ Escrow released successfully`);
    console.log(`   Transaction ID: ${txResponse.transactionId || txResponse}`);

    return {
      status: txResponse.status?.toString() || "SUCCESS",
      transactionId: txResponse.transactionId || txResponse,
    };
  } catch (error: any) {
    console.error(`❌ Escrow release failed:`, error);
    console.error(`   Error details:`, error.message);
    throw error;
  }
}

/**
 * Check if escrow exists for a question
 * @param contractId - Escrow contract ID
 * @param questionId - Question ID
 * @returns - Escrow details
 */
export async function getEscrowDetails(
  contractId: string,
  questionId: string,
): Promise<null> {
  // This would require ContractCallQuery which needs a client
  // For now, we'll track this via HCS metadata
  console.log(
    `Checking escrow for ${questionId} using contract ${contractId}...`,
  );
  return null;
}

/**
 * Query escrow status from contract (debugging helper)
 * @param client - Hedera client
 * @param contractId - Escrow contract ID
 * @param questionId - Question ID
 * @returns - Escrow data
 */
export async function queryEscrowStatus(
  client: Client,
  contractId: string,
  questionId: string,
): Promise<{
  depositor: string;
  amount: string;
  recipient: string;
  released: boolean;
  createdAt: string;
  arbitrated: boolean;
}> {
  const { ContractCallQuery } = (await import("@hashgraph/sdk")) as any;

  const numericQuestionId = parseInt(questionId.split("-")[1]);

  const query = new ContractCallQuery()
    .setContractId(ContractId.fromString(contractId))
    .setGas(100000)
    .setFunction(
      "getEscrow",
      new ContractFunctionParameters().addUint256(numericQuestionId),
    );

  const result = await query.execute(client);

  return {
    depositor: result.getAddress(0),
    amount: result.getUint256(1).toString(),
    recipient: result.getAddress(2),
    released: result.getBool(3),
    createdAt: result.getUint256(4).toString(),
    arbitrated: result.getBool(5),
  };
}

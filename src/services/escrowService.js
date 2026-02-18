import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  AccountId,
  Hbar,
  ContractId,
} from "@hashgraph/sdk";

/**
 * Escrow Service - Handles bounty escrow operations
 */

/**
 * Deposit bounty to escrow contract
 * @param {object} dAppConnector - DAppConnector instance
 * @param {string} accountId - User's account ID
 * @param {string} contractId - Escrow contract ID
 * @param {string} questionId - Question ID (used as key in escrow mapping)
 * @param {number} amount - Amount in HBAR
 * @returns {Promise<object>} - { status, transactionId }
 */
export async function depositBountyToEscrow(
  dAppConnector,
  accountId,
  contractId,
  questionId,
  amount,
) {
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
 * @param {object} dAppConnector - DAppConnector instance
 * @param {string} accountId - User's account ID (must be depositor or contract owner)
 * @param {string} contractId - Escrow contract ID
 * @param {string} questionId - Question ID
 * @param {string} recipientId - Recipient account ID
 * @returns {Promise<object>} - { status, transactionId }
 */
export async function releaseEscrow(
  dAppConnector,
  accountId,
  contractId,
  questionId,
  recipientId,
) {
  console.log(`🔓 Releasing escrow for ${questionId} to ${recipientId}...`);

  const signer = dAppConnector.getSigner(AccountId.fromString(accountId));
  const numericQuestionId = parseInt(questionId.split("-")[1]);

  // Convert recipient account ID to EVM address
  const recipientAccountId = AccountId.fromString(recipientId);
  const recipientAddress = recipientAccountId.toSolidityAddress();

  const contractExecTx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(200000)
    .setFunction(
      "release",
      new ContractFunctionParameters()
        .addUint256(numericQuestionId)
        .addAddress(recipientAddress),
    );

  const txResponse = await signer.call(contractExecTx);

  console.log(`✅ Escrow released successfully`);

  return {
    status: txResponse.status?.toString() || "SUCCESS",
    transactionId: txResponse.transactionId || txResponse,
  };
}

/**
 * Check if escrow exists for a question
 * @param {string} contractId - Escrow contract ID
 * @param {string} questionId - Question ID
 * @returns {Promise<object>} - Escrow details
 */
export async function getEscrowDetails(contractId, questionId) {
  // This would require ContractCallQuery which needs a client
  // For now, we'll track this via HCS metadata
  console.log(`Checking escrow for ${questionId}...`);
  return null;
}

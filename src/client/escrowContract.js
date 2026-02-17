import {
  ContractCreateTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  FileCreateTransaction,
  Hbar,
  AccountId,
} from "@hashgraph/sdk";

export async function deployEscrowContract(walletData, accountId) {
  console.log(`\n=======================================`);
  console.log(`- Deploying Bounty Escrow smart contract on Hedera...`);

  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId
  );
  const signer = hashconnect.getSigner(provider);

  // Import the bytecode and ABI
  const { bytecode } = await import("./escrowBytecode.js");

  // Create a file on Hedera and store the hex-encoded bytecode
  const fileCreateTx = await new FileCreateTransaction()
    .setContents(bytecode)
    .freezeWithSigner(signer);
  const fileSubmit = await fileCreateTx.executeWithSigner(signer);
  const fileCreateRx = await provider.getTransactionReceipt(
    fileSubmit.transactionId
  );
  const bytecodeFileId = fileCreateRx.fileId;
  console.log(`- The escrow contract bytecode file ID is: ${bytecodeFileId}`);

  // Create the smart contract
  const contractCreateTx = await new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(3000000)
    .freezeWithSigner(signer);
  const contractCreateSubmit = await contractCreateTx.executeWithSigner(signer);
  const contractCreateRx = await provider.getTransactionReceipt(
    contractCreateSubmit.transactionId
  );
  const cId = contractCreateRx.contractId;
  const contractAddress = cId.toSolidityAddress();
  console.log(`- The escrow contract ID is: ${cId}`);
  console.log(
    `- The escrow contract ID in Solidity format is: ${contractAddress} \n`
  );

  return [cId, contractCreateSubmit.transactionId];
}

export async function depositToEscrow(
  walletData,
  accountId,
  contractId,
  questionId,
  amount
) {
  console.log(`\n=======================================`);
  console.log(
    `- Depositing ${amount} HBAR to escrow for question ${questionId}...`
  );

  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId
  );
  const signer = hashconnect.getSigner(provider);

  // Convert amount to tinybars
  const amountInTinybars = Hbar.from(amount).toTinybars();

  // Execute deposit function
  const contractExecTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "deposit",
      new ContractFunctionParameters().addUint256(questionId)
    )
    .setPayableAmount(Hbar.fromTinybars(amountInTinybars))
    .freezeWithSigner(signer);

  const contractExecSubmit = await contractExecTx.executeWithSigner(signer);
  const contractExecRx = await provider.getTransactionReceipt(
    contractExecSubmit.transactionId
  );
  const status = contractExecRx.status;
  console.log(`- Escrow deposit: ${status}`);

  return [status, contractExecSubmit.transactionId];
}

export async function releaseFromEscrow(
  walletData,
  accountId,
  contractId,
  questionId,
  recipientAddress
) {
  console.log(`\n=======================================`);
  console.log(
    `- Releasing escrow funds for question ${questionId} to ${recipientAddress}...`
  );

  const hashconnect = walletData[0];
  const saveData = walletData[1];
  const provider = hashconnect.getProvider(
    "testnet",
    saveData.topic,
    accountId
  );
  const signer = hashconnect.getSigner(provider);

  // Convert Hedera account ID to Solidity address
  const recipientSolidityAddress =
    AccountId.fromString(recipientAddress).toSolidityAddress();

  // Execute release function
  const contractExecTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "release",
      new ContractFunctionParameters()
        .addUint256(questionId)
        .addAddress(recipientSolidityAddress)
    )
    .freezeWithSigner(signer);

  const contractExecSubmit = await contractExecTx.executeWithSigner(signer);
  const contractExecRx = await provider.getTransactionReceipt(
    contractExecSubmit.transactionId
  );
  const status = contractExecRx.status;
  console.log(`- Escrow release: ${status}`);

  return [status, contractExecSubmit.transactionId];
}

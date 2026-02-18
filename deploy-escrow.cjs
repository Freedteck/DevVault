const {
  Client,
  PrivateKey,
  AccountId,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

async function main() {
  console.log("\n===========================================");
  console.log("  Hedera BountyEscrow Contract Deployment");
  console.log("===========================================\n");

  if (!process.env.VITE_MY_ACCOUNT_ID || !process.env.VITE_MY_PRIVATE_KEY) {
    throw new Error(
      "Missing VITE_MY_ACCOUNT_ID or VITE_MY_PRIVATE_KEY in .env.local",
    );
  }

  const operatorId = AccountId.fromString(process.env.VITE_MY_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.VITE_MY_PRIVATE_KEY,
  );
  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log(`✓ Deployer Account: ${operatorId}`);
  console.log(`✓ Network: Hedera Testnet\n`);

  const aiArbiterAccountId = operatorId;
  const aiArbiterAddress = aiArbiterAccountId.toSolidityAddress();
  console.log(`✓ AI Arbiter Account: ${aiArbiterAccountId}`);
  console.log(`✓ AI Arbiter Address (EVM): ${aiArbiterAddress}\n`);

  const buildDir = path.join(__dirname, "build");
  const bytecodePath = path.join(buildDir, "BountyEscrow.bin");

  if (!fs.existsSync(bytecodePath)) {
    console.error("❌ Bytecode not found. Run: node compile-escrow.cjs first");
    process.exit(1);
  }

  const bytecode = fs.readFileSync(bytecodePath, "utf8");
  console.log(`✓ Bytecode loaded (${bytecode.length} chars)\n`);

  try {
    console.log("Step 1: Uploading bytecode to Hedera File Service...");
    const chunkSize = 4096;
    const chunks = [];
    for (let i = 0; i < bytecode.length; i += chunkSize) {
      chunks.push(bytecode.slice(i, i + chunkSize));
    }
    console.log(`  Uploading in ${chunks.length} chunks...`);

    const fileCreateTx = new FileCreateTransaction()
      .setContents(chunks[0])
      .setKeys([operatorKey.publicKey])
      .setMaxTransactionFee(new Hbar(2));

    const fileSubmit = await fileCreateTx.execute(client);
    const fileReceipt = await fileSubmit.getReceipt(client);
    const bytecodeFileId = fileReceipt.fileId;
    console.log(`  Created file: ${bytecodeFileId}`);

    if (chunks.length > 1) {
      for (let i = 1; i < chunks.length; i++) {
        console.log(`  Appending chunk ${i + 1}/${chunks.length}...`);
        const appendTx = new FileAppendTransaction()
          .setFileId(bytecodeFileId)
          .setContents(chunks[i])
          .setMaxTransactionFee(new Hbar(2));
        await appendTx.execute(client);
      }
    }

    console.log(`✓ Bytecode File ID: ${bytecodeFileId}\n`);

    console.log("Step 2: Deploying smart contract...");
    const contractCreateTx = new ContractCreateTransaction()
      .setBytecodeFileId(bytecodeFileId)
      .setGas(1000000)
      .setConstructorParameters(
        new ContractFunctionParameters().addAddress(aiArbiterAddress),
      )
      .setMaxTransactionFee(new Hbar(50));

    const contractSubmit = await contractCreateTx.execute(client);
    const contractReceipt = await contractSubmit.getReceipt(client);
    const contractId = contractReceipt.contractId;
    const contractAddress = contractId.toSolidityAddress();

    console.log(`✓ Contract ID: ${contractId}`);
    console.log(`✓ Contract Address (EVM): ${contractAddress}\n`);

    const deploymentInfo = {
      contractId: contractId.toString(),
      contractAddress: contractAddress,
      aiArbiterAccount: aiArbiterAccountId.toString(),
      aiArbiterAddress: aiArbiterAddress,
      network: "testnet",
      deployedAt: new Date().toISOString(),
      deployer: operatorId.toString(),
      bytecodeFileId: bytecodeFileId.toString(),
      transactionId: contractSubmit.transactionId.toString(),
    };

    const deploymentPath = path.join(buildDir, "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("===========================================");
    console.log("         Deployment Successful! ✅");
    console.log("===========================================");
    console.log(`Contract ID: ${contractId}`);
    console.log(`AI Arbiter: ${aiArbiterAccountId}`);
    console.log(`Arbitration Timeout: 7 days`);
    console.log(`Deployment info saved: build/deployment.json\n`);
    console.log("Add this to your .env.local:");
    console.log(`VITE_ESCROW_CONTRACT_ID=${contractId}\n`);

    client.close();
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    if (error.status) console.error(`Status: ${error.status}`);
    process.exit(1);
  }
}

main();

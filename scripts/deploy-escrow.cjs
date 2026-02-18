import { AccountId, PrivateKey, Client } from "@hashgraph/sdk";
import deployBountyEscrow from "../src/client/deployBountyEscrow.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function main() {
  console.log("===========================================");
  console.log("BountyEscrow Contract Deployment Script");
  console.log("===========================================\n");

  // Get operator credentials from environment
  const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
  const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);

  // Create client
  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log(`Deployer Account: ${operatorId}`);

  // Get AI arbiter address from environment or use deployer's address
  let aiArbiterAddress;
  if (process.env.AI_ARBITER_ACCOUNT_ID) {
    const aiArbiterAccountId = AccountId.fromString(process.env.AI_ARBITER_ACCOUNT_ID);
    aiArbiterAddress = aiArbiterAccountId.toSolidityAddress();
    console.log(`AI Arbiter Account: ${process.env.AI_ARBITER_ACCOUNT_ID}`);
  } else {
    aiArbiterAddress = operatorId.toSolidityAddress();
    console.log(`AI Arbiter Account: ${operatorId} (using deployer account)`);
  }
  console.log(`AI Arbiter Address (EVM): ${aiArbiterAddress}\n`);

  // Mock wallet data for operator-based deployment
  const mockWalletData = {
    getSigner: () => ({
      getAccountId: () => operatorId,
      executeWithSigner: async (tx) => {
        return await tx.execute(client);
      },
      freezeWithSigner: async (tx) => {
        return await tx.freeze();
      },
    }),
  };

  try {
    const [contractId, transactionId, contractAddress] = await deployBountyEscrow(
      mockWalletData,
      operatorId.toString(),
      aiArbiterAddress
    );

    console.log("\n===========================================");
    console.log("Deployment Summary:");
    console.log("===========================================");
    console.log(`Contract ID: ${contractId}`);
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Transaction ID: ${transactionId}`);
    console.log(`AI Arbiter: ${aiArbiterAddress}`);
    console.log(`Arbitration Timeout: 7 days`);

    // Save deployment info
    const deploymentInfo = {
      contractId: contractId.toString(),
      contractAddress,
      transactionId: transactionId.toString(),
      aiArbiter: aiArbiterAddress,
      network: "testnet",
      deployedAt: new Date().toISOString(),
      deployer: operatorId.toString(),
    };

    const deploymentPath = path.resolve(__dirname, "../build/deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: build/deployment.json`);

    console.log("\n✅ Deployment completed successfully!");
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }

  client.close();
}

main();

import {
  FileCreateTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  AccountId,
} from "@hashgraph/sdk";
import * as solc from "solc";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Compile and deploy BountyEscrow contract with AI arbiter
 * @param {object} dAppConnector - DAppConnector instance
 * @param {string} accountId - Deployer's account ID
 * @param {string} aiArbiterAddress - AI arbiter account address in EVM format (0x...)
 * @returns {Promise<Array>} - [contractId, transactionId, contractAddress]
 */
async function deployBountyEscrow(dAppConnector, accountId, aiArbiterAddress) {
  console.log(`\n=======================================`);
  console.log(`- Compiling and deploying BountyEscrow contract...`);
  console.log(`- AI Arbiter Address: ${aiArbiterAddress}`);

  const signer = dAppConnector.getSigner(AccountId.fromString(accountId));

  // Read the Solidity source code
  const contractPath = path.resolve(__dirname, "../../contracts/BountyEscrow.sol");
  const source = fs.readFileSync(contractPath, "utf8");

  // Compile the contract
  const input = {
    language: "Solidity",
    sources: {
      "BountyEscrow.sol": {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  console.log("- Compiling contract...");
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((error) => error.severity === "error");
    if (errors.length > 0) {
      console.error("Compilation errors:");
      errors.forEach((error) => console.error(error.formattedMessage));
      throw new Error("Contract compilation failed");
    }
  }

  const contract = output.contracts["BountyEscrow.sol"]["BountyEscrow"];
  const bytecode = contract.evm.bytecode.object;
  const abi = contract.abi;

  console.log("- Contract compiled successfully");
  console.log(`- Bytecode length: ${bytecode.length} characters`);

  // Save ABI for later use
  const buildDir = path.resolve(__dirname, "../../build");
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(buildDir, "BountyEscrow.json"),
    JSON.stringify({ abi, bytecode }, null, 2)
  );
  console.log("- ABI saved to build/BountyEscrow.json");

  // Create a file on Hedera and store the hex-encoded bytecode
  console.log("- Creating bytecode file on Hedera...");
  let fileCreateTx = new FileCreateTransaction()
    .setContents(bytecode)
    .setMaxTransactionFee(100);

  // Sign and execute the transaction
  fileCreateTx = await signer.signTransaction(fileCreateTx);
  const fileSubmit = await signer.call(fileCreateTx);
  const bytecodeFileId = fileSubmit.fileId;
  console.log(`- Bytecode file ID: ${bytecodeFileId}`);

  // Deploy the contract with AI arbiter address as constructor parameter
  console.log("- Deploying contract...");
  let contractCreateTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(3000000)
    .setConstructorParameters(
      new ContractFunctionParameters().addAddress(aiArbiterAddress)
    )
    .setMaxTransactionFee(100);

  // Sign and execute the transaction
  contractCreateTx = await signer.signTransaction(contractCreateTx);
  const contractSubmit = await signer.call(contractCreateTx);
  const contractId = contractSubmit.contractId;
  const contractAddress = contractId.toSolidityAddress();

  console.log(`- Contract deployed successfully!`);
  console.log(`- Contract ID: ${contractId}`);
  console.log(`- Contract address (Solidity): ${contractAddress}`);
  console.log(`- Transaction ID: ${contractSubmit.transactionId}`);

  return [contractId, contractSubmit.transactionId.toString(), contractAddress];
}

export default deployBountyEscrow;

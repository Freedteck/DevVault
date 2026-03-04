/**
 * Deploy DevVault smart contracts to Hedera testnet using HSCS.
 *
 * Usage:
 *   node scripts/deploy-contracts.mjs
 *
 * Outputs contract IDs to console — add them to .env.local as:
 *   NEXT_PUBLIC_BOUNTY_CONTRACT_ID=0.0.XXXXX
 *   NEXT_PUBLIC_SWAP_CONTRACT_ID=0.0.XXXXX
 *
 * Requires:  HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY in .env.local
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";
import solc from "solc";

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const rootDir = resolve(__dir, "..");

dotenv.config({ path: resolve(rootDir, ".env.local") });

// ─── Parse env ───────────────────────────────────────────────────────────────

const operatorId = process.env.OPERATOR_ACCOUNT_ID;
const operatorKey = process.env.OPERATOR_PRIVATE_KEY;

if (!operatorId || !operatorKey) {
  console.error("❌  OPERATOR_ACCOUNT_ID and OPERATOR_PRIVATE_KEY must be set in .env.local");
  process.exit(1);
}

// ─── Dynamic Hedera SDK import (avoids ESM/CJS issues) ─────────────────────

const {
  Client,
  ContractCreateFlow,
  PrivateKey,
} = await import("@hashgraph/sdk");

// ─── Compile contracts ───────────────────────────────────────────────────────

function compileSolidity(filename) {
  const source = readFileSync(resolve(rootDir, "contracts", filename), "utf8");
  const contractName = filename.replace(".sol", "");

  const input = {
    language: "Solidity",
    sources: { [filename]: { content: source } },
    settings: {
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object"] },
      },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors?.some((e) => e.severity === "error")) {
    console.error("Compilation errors:", output.errors);
    process.exit(1);
  }

  const compiled = output.contracts[filename][contractName];
  return {
    bytecode: compiled.evm.bytecode.object, // hex string, no 0x prefix
    abi: compiled.abi,
  };
}

// ─── Deploy a contract ───────────────────────────────────────────────────────

async function deployContract(client, bytecode, name) {
  console.log(`\nDeploying ${name}…`);

  const tx = await new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(1_000_000)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const contractId = receipt.contractId.toString();
  console.log(`✅  ${name} deployed: ${contractId}`);
  return contractId;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const client = Client.forTestnet();
  // Operator key is ECDSA hex — strip leading 0x if present
  const rawKey = operatorKey.startsWith("0x")
    ? operatorKey.slice(2)
    : operatorKey;
  const privKey = PrivateKey.fromStringECDSA(rawKey);
  client.setOperator(operatorId, privKey);

  // Compile
  console.log("Compiling contracts…");
  const bounty = compileSolidity("DevVaultBounty.sol");
  const swap = compileSolidity("DevVaultSwap.sol");
  console.log("✅  Compilation successful");

  // Deploy
  const bountyContractId = await deployContract(client, bounty.bytecode, "DevVaultBounty");
  const swapContractId = await deployContract(client, swap.bytecode, "DevVaultSwap");

  console.log("\n─────────────────────────────────────────────");
  console.log("Add these to your .env.local:");
  console.log(`NEXT_PUBLIC_BOUNTY_CONTRACT_ID=${bountyContractId}`);
  console.log(`NEXT_PUBLIC_SWAP_CONTRACT_ID=${swapContractId}`);
  console.log("─────────────────────────────────────────────\n");

  client.close();
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});

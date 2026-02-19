/**
 * One-time script to fix the aiArbiter address stored in the contract.
 *
 * The contract was deployed with aiArbiter = toSolidityAddress() (long-form 0x000...4794a4),
 * but msg.sender in EVM is the actual ECDSA-derived address (0x7cf241...).
 * The onlyArbiter modifier therefore always reverts.
 *
 * This script calls updateArbiter() (onlyOwner, which is fine) with the real EVM address.
 */

const {
  Client,
  PrivateKey,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
} = require("@hashgraph/sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

async function main() {
  const accountIdStr = process.env.VITE_MY_ACCOUNT_ID;
  const privateKeyStr = process.env.VITE_MY_PRIVATE_KEY;
  const contractIdStr = process.env.VITE_ESCROW_CONTRACT_ID;

  if (!accountIdStr || !privateKeyStr || !contractIdStr) {
    throw new Error(
      "Missing VITE_MY_ACCOUNT_ID, VITE_MY_PRIVATE_KEY, or VITE_ESCROW_CONTRACT_ID in .env.local",
    );
  }

  // Fetch the actual EVM address from mirror node
  console.log(`Fetching actual EVM address for ${accountIdStr}...`);
  const res = await fetch(
    `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountIdStr}`,
  );
  const data = await res.json();
  const actualEvmAddress = data.evm_address;

  if (!actualEvmAddress) {
    throw new Error(`Could not get EVM address for ${accountIdStr}`);
  }
  console.log(`Actual EVM address: ${actualEvmAddress}`);

  const client = Client.forTestnet().setOperator(
    AccountId.fromString(accountIdStr),
    PrivateKey.fromStringECDSA(privateKeyStr),
  );

  console.log(`Calling updateArbiter on contract ${contractIdStr}...`);

  const tx = new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractIdStr))
    .setGas(100000)
    .setMaxTransactionFee(new Hbar(2))
    .setFunction(
      "updateArbiter",
      new ContractFunctionParameters().addAddress(actualEvmAddress),
    );

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  console.log(`\n✅ updateArbiter succeeded!`);
  console.log(`   Status: ${receipt.status}`);
  console.log(`   Transaction: ${response.transactionId}`);
  console.log(`   aiArbiter is now: ${actualEvmAddress}`);
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});

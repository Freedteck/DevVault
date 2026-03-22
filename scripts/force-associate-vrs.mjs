/**
 * Associate VRS token with the VursoBounty contract using a direct
 * TokenAssociateTransaction signed by the operator (contract admin key).
 *
 * This bypasses the selfAssociate() precompile call which needs special
 * HTS permissions. Instead, the operator—who holds the admin key—signs
 * the association directly.
 *
 * Run ONCE: node scripts/force-associate-vrs.mjs
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const rootDir = resolve(dirname(__filename), "..");
dotenv.config({ path: resolve(rootDir, ".env.local") });

const { Client, PrivateKey, TokenAssociateTransaction, TokenId, AccountId } =
  await import("@hiero-ledger/sdk");

const operatorId = process.env.OPERATOR_ACCOUNT_ID;
const operatorKey = process.env.OPERATOR_PRIVATE_KEY;
const bountyContractId = process.env.NEXT_PUBLIC_BOUNTY_CONTRACT_ID;
const vrsTokenId = process.env.NEXT_PUBLIC_VRS_TOKEN_ID;

if (!operatorId || !operatorKey || !bountyContractId || !vrsTokenId) {
  console.error("❌  Missing env vars");
  process.exit(1);
}

const rawKey = operatorKey.startsWith("0x")
  ? operatorKey.slice(2)
  : operatorKey;
const operatorPrivKey = PrivateKey.fromStringECDSA(rawKey);

const client = Client.forTestnet().setOperator(operatorId, operatorPrivKey);

console.log(
  `\n🔗  Associating VRS token (${vrsTokenId}) with VursoBounty contract (${bountyContractId})…`,
);

try {
  const tx = await new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(bountyContractId))
    .setTokenIds([TokenId.fromString(vrsTokenId)])
    .freezeWith(client)
    .sign(operatorPrivKey);

  const result = await tx.execute(client);
  const receipt = await result.getReceipt(client);

  console.log(`\n✅  Association successful! Status: ${receipt.status}`);
  console.log(`    TX: ${result.transactionId.toString()}`);
  console.log(`\n    VursoBounty can now receive and hold VRS tokens.\n`);
} catch (err) {
  if (err.message?.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")) {
    console.log(`\n✅  Contract is already associated with VRS. All good!\n`);
    process.exit(0);
  }
  console.error("❌  Association failed:", err.message || err);
  process.exit(1);
}

client.close();

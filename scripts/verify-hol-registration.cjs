/**
 * verify-hol-registration.cjs
 *
 * Checks if the DevVault AI Agent is registered in the HOL guarded registry.
 * If not, re-submits the registration using the existing account + topics.
 *
 * Run:  node scripts/verify-hol-registration.cjs
 */

"use strict";

const path = require("path");
const fs = require("fs");

// Load .env.local
const dotenvPath = path.resolve(__dirname, "../.env.local");
const envRaw = fs.readFileSync(dotenvPath, "utf8");
for (const line of envRaw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  let val = trimmed.slice(idx + 1).trim();
  const commentIdx = val.indexOf(" #");
  if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
  if (!process.env[key]) process.env[key] = val;
}

const AGENT_ACCOUNT_ID = process.env.VITE_AGENT_ACCOUNT_ID;
const AGENT_PRIVATE_KEY = process.env.VITE_AGENT_PRIVATE_KEY;
const INBOUND_TOPIC_ID = process.env.VITE_AGENT_INBOUND_TOPIC_ID;
const OUTBOUND_TOPIC_ID = process.env.VITE_AGENT_OUTBOUND_TOPIC_ID;

if (!AGENT_ACCOUNT_ID || !AGENT_PRIVATE_KEY || !INBOUND_TOPIC_ID) {
  console.error(
    "ERROR: VITE_AGENT_* vars missing in .env.local. Run register-hol-agent.cjs first.",
  );
  process.exit(1);
}

const sdkPath = path.resolve(
  __dirname,
  "../node_modules/@hashgraphonline/standards-sdk/dist/cjs/standards-sdk.cjs",
);
const { HCS10Client } = require(sdkPath);

async function main() {
  console.log("=== DevVault HOL Registration Verify / Re-register ===\n");
  console.log("Agent account :", AGENT_ACCOUNT_ID);
  console.log("Inbound topic :", INBOUND_TOPIC_ID);
  console.log("Outbound topic:", OUTBOUND_TOPIC_ID);
  console.log("");

  // Client operating AS the agent account
  const client = new HCS10Client({
    network: "testnet",
    operatorId: AGENT_ACCOUNT_ID,
    operatorPrivateKey: AGENT_PRIVATE_KEY,
    logLevel: "info",
    prettyPrint: true,
    guardedRegistryBaseUrl: "https://moonscape.tech",
  });

  console.log("Registering with HOL guarded registry...\n");

  const result = await client.registerAgentWithGuardedRegistry(
    AGENT_ACCOUNT_ID,
    "testnet",
    {
      progressCallback: (p) => {
        process.stdout.write(`\r  ${p.stage} — ${p.progressPercent}%         `);
      },
      maxAttempts: 60,
      delayMs: 3000,
    },
  );

  process.stdout.write("\n\n");

  if (result.success) {
    console.log("✅ Agent is registered in the HOL registry!");
    console.log("   Transaction ID:", result.transactionId);
    console.log("\nYou can verify at:");
    console.log(`  https://hol.org/registry`);
    console.log(`  Search for account: ${AGENT_ACCOUNT_ID}`);
    console.log(`  or look for: DevVault AI Assistant`);
  } else {
    console.error("❌ Registration failed:", result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n❌ Unexpected error:", err.message || err);
  process.exit(1);
});

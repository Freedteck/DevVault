/**
 * register-hol-agent.cjs
 *
 * One-time setup: creates a dedicated DevVault AI Agent account on Hedera,
 * sets up its HCS-10 inbound + outbound topics, stores an HCS-11 profile,
 * and registers it in the HOL guarded registry.
 *
 * Run:  node scripts/register-hol-agent.cjs
 *
 * After success, add the printed env vars to .env.local and restart the app.
 */

"use strict";

const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// 1.  Load .env.local
// ---------------------------------------------------------------------------
const dotenvPath = path.resolve(__dirname, "../.env.local");
if (!fs.existsSync(dotenvPath)) {
  console.error("ERROR: .env.local not found at", dotenvPath);
  process.exit(1);
}

// Parse .env.local manually (simple key=value, ignore comments)
const envRaw = fs.readFileSync(dotenvPath, "utf8");
for (const line of envRaw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  let val = trimmed.slice(idx + 1).trim();
  // Strip inline comments
  const commentIdx = val.indexOf(" #");
  if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
  if (!process.env[key]) process.env[key] = val;
}

const ACCOUNT_ID = process.env.VITE_MY_ACCOUNT_ID;
const PRIVATE_KEY = process.env.VITE_MY_PRIVATE_KEY;

if (!ACCOUNT_ID || !PRIVATE_KEY) {
  console.error("ERROR: VITE_MY_ACCOUNT_ID or VITE_MY_PRIVATE_KEY missing in .env.local");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2.  Load SDK (CJS build)
// ---------------------------------------------------------------------------
const sdkPath = path.resolve(
  __dirname,
  "../node_modules/@hashgraphonline/standards-sdk/dist/cjs/standards-sdk.cjs"
);
let sdk;
try {
  sdk = require(sdkPath);
} catch (e) {
  console.error("ERROR: Could not load @hashgraphonline/standards-sdk CJS build:", e.message);
  process.exit(1);
}

const { HCS10Client, AgentBuilder, AIAgentCapability } = sdk;

// ---------------------------------------------------------------------------
// 3.  Run registration
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== DevVault HOL Agent Registration ===\n");
  console.log("Operator account:", ACCOUNT_ID);
  console.log("Network: testnet\n");

  // Initialize client with operator (payer) credentials
  const client = new HCS10Client({
    network: "testnet",
    operatorId: ACCOUNT_ID,
    operatorPrivateKey: PRIVATE_KEY,
    logLevel: "info",
    prettyPrint: true,
  });

  // Configure the DevVault AI Agent
  const agentBuilder = new AgentBuilder()
    .setName("DevVault AI Assistant")
    .setDescription(
      "AI-powered Q&A assistant for the DevVault developer community on Hedera. " +
      "Answers developer questions submitted via HCS topics using LLaMA 3.3-70B."
    )
    .setAgentType("autonomous")
    .setModel("llama-3.3-70b-versatile")
    .setNetwork("testnet")
    .setCapabilities([
      AIAgentCapability.TEXT_GENERATION,
      AIAgentCapability.KNOWLEDGE_RETRIEVAL,
    ])
    .setMetadata({
      creator: "DevVault",
      version: "1.0.0",
      properties: {
        platform: "DevVault",
        questionTopicId: process.env.VITE_NEW_QUESTION_TOPIC_ID || "",
        acceptanceTopicId: process.env.VITE_NEW_ACCEPTANCE_TOPIC_ID || "",
        repository: "https://github.com/freedtek/DevVault",
      },
    });

  console.log("Creating and registering agent with HOL registry...\n");
  console.log("(This may take 30–60 seconds — creating account, topics, and profile)\n");

  const result = await client.createAndRegisterAgent(agentBuilder, {
    progressCallback: (progress) => {
      const bar = "█".repeat(Math.round(progress.progressPercent / 5)).padEnd(20, "░");
      process.stdout.write(`\r[${bar}] ${progress.progressPercent}%  ${progress.stage}            `);
    },
  });

  process.stdout.write("\n\n");

  if (!result.success) {
    console.error("❌ Agent registration FAILED:", result.error);
    process.exit(1);
  }

  const m = result.metadata;
  console.log("✅ Agent registered successfully!\n");
  console.log("────────────────────────────────────────");
  console.log("Agent Account ID    :", m.accountId);
  console.log("Inbound Topic ID    :", m.inboundTopicId);
  console.log("Outbound Topic ID   :", m.outboundTopicId);
  console.log("Profile Topic ID    :", m.profileTopicId);
  console.log("────────────────────────────────────────\n");
  console.log("⚠️  IMPORTANT: Store the private key securely — it is shown only once!\n");
  console.log("Agent Private Key   :", m.privateKey);
  console.log("\n────────────────────────────────────────");
  console.log("Add these lines to .env.local:\n");
  console.log(`VITE_AGENT_ACCOUNT_ID=${m.accountId}`);
  console.log(`VITE_AGENT_PRIVATE_KEY=${m.privateKey}`);
  console.log(`VITE_AGENT_INBOUND_TOPIC_ID=${m.inboundTopicId}`);
  console.log(`VITE_AGENT_OUTBOUND_TOPIC_ID=${m.outboundTopicId}`);
  console.log(`VITE_AGENT_PROFILE_TOPIC_ID=${m.profileTopicId}`);
  console.log("────────────────────────────────────────\n");

  // Also write to a local credentials file for safety
  const credPath = path.resolve(__dirname, "../agent-credentials.json");
  fs.writeFileSync(credPath, JSON.stringify(m, null, 2));
  console.log(`Credentials also saved to: ${credPath}`);
  console.log("(Add agent-credentials.json to .gitignore!)\n");
}

main().catch((err) => {
  console.error("\n❌ Unexpected error:", err);
  process.exit(1);
});

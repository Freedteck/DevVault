# DevVault — Apex 2026 Agent Context File

> This file is a living reference for the AI agent working on this project.
> It captures architecture decisions, current state, what is done, and what remains.
> **Last updated: All 11 planned features complete. Build: 15 pages, 0 errors.**

---

## Project Identity

- **Name:** DevVault
- **Hackathon:** Hedera Hello Future Apex 2026
- **Track:** Legacy Builders (returning from Hello Future Hackathon 2.0, 2024)
- **Deadline:** 23 March 2026, 11:59 PM ET
- **Prize:** 1st $18,500 / 2nd $13,500 / 3rd $8,000
- **Eligible bounty:** HOL (Hashgraph Online) — $8K for HCS-10 AI agent registration
- **Repo:** /home/freed/Projects/Hackathons/DevVault/devvault
- **Deploy target:** Vercel

---

## What DevVault Is

A decentralised developer knowledge-sharing platform on Hedera.
- **Debugger's Den** — Q&A for technical questions, answers, bounties
- **Updates** — Dev updates, frameworks, industry news

Core principle: Every feature connects to knowledge sharing or making contribution rewarding.
Differentiator: portable, verifiable developer reputation powered by Hedera HCS + DVT token.

---

## On-Chain Infrastructure (Testnet — All Deployed)

| Resource | ID |
|----------|----|
| Operator Account | 0.0.4691108 |
| DVT Token | 0.0.8056228 |
| Registry Topic | 0.0.8056229 |
| Questions Topic | 0.0.8056232 |
| Updates Topic | 0.0.8056233 |
| DevVaultBounty Contract | 0.0.8061418 |
| DevVaultSwap Contract | 0.0.8061421 |

- DVT: Name=DevVaultToken, Symbol=DVT, Decimals=2, InitialSupply=1,000,000, SupplyType=INFINITE
- Per-post discussionTopicId: created server-side by operator at question/update submission time
- Network: Hedera Testnet

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 |
| Wallet | @hashgraph/hedera-wallet-connect 2.0.6 (WalletConnect v2) |
| Hedera server-side | @hashgraph/sdk 2.80.0 (API routes only) |
| Hedera client-side | @hiero-ledger/sdk 2.79.0 (explicit dep) |
| IPFS/Storage | Pinata (uploads from API routes, reads via public gateway) |
| Smart Contracts | DevVaultBounty (0.0.8061418), DevVaultSwap (0.0.8061421) — DEPLOYED |
| AI Agent | scripts/ai-agent.mjs — HCS-10 registered, polls Questions topic |
| Package manager | pnpm |

---

## Architecture: How Data Flows

```
User action
  → Frontend (Next.js)
    → [If new post] POST /api/questions|updates
        → operator creates discussionTopic on Hedera
        → body uploaded to Pinata IPFS (if >256 chars)
        → returns { discussionTopicId, bodyCid? }
    → User wallet signs TopicMessageSubmitTransaction → Hedera HCS
  ← Mirror Node reads (topics, messages, balances, token holders)
  → [Tips] TransferTransaction signed by user wallet
  → [Bounty lock] ContractExecuteTransaction → DevVaultBounty.lockHbar()
  → [Bounty release] ContractExecuteTransaction → DevVaultBounty.release()
  → [DVT swap] ContractExecuteTransaction → DevVaultSwap.swap()
  → [HCS-11 profile] TopicCreate + TopicMessageSubmit + AccountUpdate
```

### HCS Message Types (hcs-types.ts)
- `QUESTION` → QUESTIONS_TOPIC_ID — includes discussionTopicId, bodyCid?
- `UPDATE` → UPDATES_TOPIC_ID — includes discussionTopicId, bodyCid?
- `ANSWER` → question's discussionTopicId — includes bodyCid?
- `COMMENT` → post's discussionTopicId
- `ACCEPT` → question's discussionTopicId — marks accepted answerer
- `PROFILE` → user's personal profile topic (HCS-11)
- `AI_COMMENT` → question's discussionTopicId — posted by AI agent
- `AGENT_REGISTER` → Registry topic — agent registration (HCS-10)
- `AGENT_ACTION` → agent's outbound topic — audit trail

### Key Library Files
- `src/lib/hedera-sdk.ts` — server-only, operator key, creates topics
- `src/lib/hedera-client-tx.ts` — client-side, user wallet signs all user content
- `src/lib/hedera-mirror.ts` — Mirror Node queries (getTopicMessages, getTopicInfo, getTokenTopHolders, getAccountInfo)
- `src/lib/hedera-contracts.ts` — CLIENT contract calls: lockBounty, releaseBounty, swapHbarForDVT
- `src/lib/ipfs.ts` — uploadToIPFS (server), fetchFromIPFS (client + server)
- `src/lib/hcs-types.ts` — canonical on-chain payload types
- `src/lib/live-types.ts` — view-model types (derived from HCS after decode)
- `scripts/ai-agent.mjs` — HCS-10 AI duplicate detection agent
- `scripts/deploy-contracts.mjs` — compiled + deployed both contracts (one-time)
- `contracts/DevVaultBounty.sol` — HBAR escrow: lockHbar, release, cancel, sweepFees
- `contracts/DevVaultSwap.sol` — HBAR→DVT swap at 92 DVT/HBAR rate

---

## Feature Status — ALL COMPLETE ✅

| # | Feature | Status |
|---|---------|--------|
| 1 | DEVVAULT_CONTEXT.md | ✅ Done |
| 2 | @hiero-ledger/sdk explicit dep | ✅ Done |
| 3 | DVT/HBAR tip transactions (real blockchain, currency toggle) | ✅ Done |
| 4 | Answer acceptance (ACCEPT HCS message, frontend derives accepted state) | ✅ Done |
| 5 | answerCount from topic sequence_number (batch getTopicInfo) | ✅ Done |
| 6 | IPFS/Pinata for long bodies (bodyCid in HCS payload, resolved in detail pages) | ✅ Done |
| 7 | Live leaderboard (real DVT holders + activity counts from Mirror Node) | ✅ Done |
| 8 | HCS-11 profiles page (real Mirror Node + wallet, create/update) | ✅ Done |
| 9 | Bounty + Swap smart contracts (deployed to testnet) | ✅ Done |
| 10 | DVT swap frontend (SwapModal in TopBar, releaseBounty on accept) | ✅ Done |
| 11 | HCS-10 AI agent (duplicate detection, registered in Registry topic) | ✅ Done |

---

## Smart Contracts

### DevVaultBounty (0.0.8061418)
```solidity
function lockHbar(string memory topicId, uint256 seqNum) external payable
function release(string memory topicId, uint256 seqNum, address winner) external
function cancel(string memory topicId, uint256 seqNum) external
function getBounty(string memory topicId, uint256 seqNum) external view
function sweepFees() external onlyOwner
```
- Platform fee: 3% on release
- bountyId = keccak256(topicId, sequenceNumber)
- Only depositor (question asker) can release or cancel

### DevVaultSwap (0.0.8061421)
```solidity
function swap(string memory hederaAccountId) external payable  // emits SwapRequested
function quote(uint256 tinybars) external view returns (uint256)
function setRate(uint256 newRate) external onlyOwner
function sweep() external onlyOwner
```
- Rate: 92 DVT per 1 HBAR (8% spread)
- Emits SwapRequested event; platform monitors via Mirror Node and transfers DVT

---

## HCS-10 AI Agent (scripts/ai-agent.mjs)

```
pnpm run agent
```
- **hedera-agent-kit** (v3) — HederaLangchainToolkit wraps Hedera HCS as LangChain tools
- **@langchain/groq** — ChatGroq with llama-3.3-70b-versatile (the Hedera-recommended Groq integration)
- **@hashgraphonline/standards-sdk** — HCS10Client for HCS-10 registration + HCS-11 profile (HOL bounty)
- Creates inbound + outbound topics on first run via HCS10Client → auto-appended to .env.local
- Registers in HOL Registry via HCS10Client.registerAgent()
- Stores HCS-11 agent profile via HCS10Client.storeHCS11Profile()
- Bootstraps question cache using get_topic_messages_query_tool (hedera-agent-kit)
- Polls Questions topic every 30s via get_topic_messages_query_tool
- Uses ChatGroq (Groq llama-3.3-70b-versatile) for semantic duplicate detection (threshold: 0.82)
- Posts AI_COMMENT via submit_topic_message_tool (hedera-agent-kit) when duplicate detected
- Posts AGENT_ACTION audit entry to outbound topic via HCS10Client.submitPayload()
- Degrades gracefully when GROQ_API_KEY not set (cache only mode)

---

## HCS-11 Profile Schema (profile/page.tsx)
```json
{
  "standard": "HCS-11",
  "type": "PROFILE",
  "displayName": "freed.dev",
  "bio": "Fullstack dev | Hedera | React | Solidity",
  "skills": ["React", "TypeScript", "Hedera", "Solidity"],
  "github": "https://github.com/Freedteck",
  "authorAccountId": "0.0.4691108",
  "timestamp": 1234567890
}
```
- Account memo updated to: `hcs11:0.0.PROFILE_TOPIC_ID`
- Discoverable by anyone who knows account ID
- Create = 3 steps: TopicCreate → PROFILE message → AccountUpdate memo

---

## Revenue Model
- Tip fee: 3% via smart contract tip routing (future)
- Bounty claim fee: 3% (sweepFees in DevVaultBounty)
- DVT swap spread: 8% (1 HBAR = 92 DVT via DevVaultSwap)

---

## Leaderboard Scoring
```
score = dvtBalance + (acceptedAnswerCount * 10)
```
- dvtBalance from Mirror Node token balance endpoint
- acceptedAnswerCount from counting ACCEPT messages where answererAccountId = user
- Revalidated every 120s

---

## Judging Criteria (Legacy Builders)
| Criterion | Weight |
|-----------|--------|
| Baseline quality (was 2024 real/coherent) | 30% |
| Delta in product scope & UX | 25% |
| Delta in technical robustness | 15% |
| Delta in traction/validation | 15% |
| Delta in Hedera integration depth | 15% |

**Key delta from 2024:** 40% mock → 100% real data; 0 → 2 smart contracts deployed; HCS-10 AI agent; HCS-11 profiles; IPFS storage.

---

## Environment Variables (.env.local)
```bash
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=1fa101b4626e72a37755d2a1fc5b205d
OPERATOR_ACCOUNT_ID=0.0.4691108
OPERATOR_PRIVATE_KEY=0xb8de43b43f69478f53b2ffdd74c7d4933efb127431f2e11428dc1b0c056c5cf1
NEXT_PUBLIC_DVT_TOKEN_ID=0.0.8056228
NEXT_PUBLIC_REGISTRY_TOPIC_ID=0.0.8056229
NEXT_PUBLIC_QUESTIONS_TOPIC_ID=0.0.8056232
NEXT_PUBLIC_UPDATES_TOPIC_ID=0.0.8056233
NEXT_PUBLIC_BOUNTY_CONTRACT_ID=0.0.8061418   # DevVaultBounty
NEXT_PUBLIC_SWAP_CONTRACT_ID=0.0.8061421     # DevVaultSwap
# IPFS (add Pinata credentials):
PINATA_JWT=<your-pinata-jwt>
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
# AI Agent (Groq — https://console.groq.com/keys):
GROQ_API_KEY=<your-groq-api-key>
# Auto-populated by AI agent on first run:
# AGENT_INBOUND_TOPIC_ID=
# AGENT_OUTBOUND_TOPIC_ID=
```

---

## NPM Scripts
```bash
pnpm dev                  # Next.js dev server
pnpm build                # Production build (15 pages, 0 errors)
pnpm start                # Serve production build
pnpm run agent            # Run HCS-10 AI agent
pnpm run deploy:contracts # Recompile + redeploy smart contracts
pnpm run setup:hedera     # One-time infrastructure setup
```

---

## Demo Flow for Judges
1. Open app, show live Questions feed (reads Mirror Node, not mock data)
2. Connect HashPack wallet
3. Post a question with HBAR bounty → demonstrate lockHbar contract call
4. Post an answer → demonstrate HCS message on discussionTopicId
5. Accept the answer → ACCEPT message posted, bounty released via releaseBounty()
6. Tip the author with DVT → real TransferTransaction
7. Visit Profile page → show HCS-11 create/edit
8. Visit Leaderboard → real DVT holders ranked by score
9. Click "Swap DVT" in TopBar → SwapModal, swapHbarForDVT() call
10. Show AI Agent terminal output with duplicate detection comment on-chain


---

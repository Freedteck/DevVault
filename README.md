# Vurso

_formerly DevVault_

> **Where developer knowledge has real value.**

A decentralised developer knowledge platform built entirely on Hedera. Vurso introduces economic accountability into knowledge sharing — every bounty answer is human-written and economically verified, every contribution is permanently recorded on-chain, and every developer owns their reputation.

**Submitted to the [Hedera Hello Future Apex Hackathon 2026](https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026) — Legacy Builders Track.**

---

## The Problem

Developers today face two broken options:

**LLMs (Copilot, Claude, ChatGPT)** — Fast and convenient, but they hallucinate confidently. When an LLM gives you wrong code that breaks production, it loses nothing. It will give the same wrong answer to the next 10,000 developers. Every prompt you type today is training the next version — for free, for them.

**Stack Overflow** — Slow. Urgent questions sit in moderation queues for days. Your reputation lives on their server — they control it, they can delete it. And they already sold their community's data to OpenAI. The developers who wrote those millions of answers were never compensated.

In both cases: the developer who shares knowledge earns nothing, owns nothing, and is accountable for nothing.

---

## The Solution

Vurso introduces the one thing every existing platform is missing: **skin in the game — for everyone.**

> Copilot gives you an answer. Vurso gives you an answer from someone who got paid to be right.

### The Two-Tier Knowledge System

**Free questions** → The Vurso AI agent answers instantly. Labeled clearly, a useful baseline for simple problems.

**Bounty questions** → The AI stays silent. When a developer pays to ask, they have already tried the free AI route and it failed them. Bounty questions are answered exclusively by human experts who stake a deposit to participate. This produces a dataset that is 100% human-written, human-tested, and economically verified — something that does not exist anywhere else.

### The Paid-to-Answer Deposit Mechanic

Before posting an answer on a bounty question, the answerer pays a small deposit (~1% of the bounty):

- **Answer accepted** → bounty + deposit returned to the expert
- **Not chosen but genuine** → deposit fully refunded
- **Spam or bad-faith** → deposit lost

Experts risk nothing for being second-best. They only lose for being bad. This eliminates spam, rewards quality, and makes the platform self-regulating — no moderation team needed.

---

## How Vurso Wins Against LLMs

| Structural Limitation      | LLMs                                        | Vurso                                                   |
| -------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Accountability for answers | None — wrong answers cost nothing           | Deposit at stake — only spam loses it, not second place |
| Knowledge compounding      | None — every chat is private                | Every answer is permanent and searchable on-chain       |
| Contributor earnings       | Zero                                        | HBAR + VRS bounties, tips, dataset royalties            |
| Training data ownership    | Owned by the AI company                     | Owned by the developer who wrote it                     |
| Bounty question quality    | AI answers unverified, no skin in game      | Human experts only — AI never competes for bounties     |
| Reputation                 | Nowhere                                     | On-chain, portable, permanent                           |
| Current knowledge          | Training cutoff — outdated for new releases | Real-time — experts answer as events happen             |

These are permanent architectural limitations. LLMs cannot fix them regardless of how much better they get.

---

## Core Features

**The Den (Q&A)**

- Post questions with optional HBAR or VRS bounties locked in smart contract escrow
- AI agent answers free questions instantly; human experts compete for bounty questions
- Paid-to-answer deposit mechanic filters spam without punishing genuine effort
- Automatic bounty release on acceptance — no manual steps, no trust required
- Every question and answer is permanently recorded on Hedera via HCS

**Updates**

- Developers share framework discoveries, breaking changes, security insights
- Readers tip authors directly in HBAR or VRS — peer to peer, no intermediary
- Each update has its own dedicated HCS discussion topic

**On-Chain Profiles (HCS-11)**

- Developer identity tied to your Hedera wallet — not a platform database
- Discoverable by account ID from any platform that reads HCS-11
- Permanent contribution history: accepted answers, VRS earned, bounties won

**Leaderboard**

- Ranked by real on-chain VRS earned — verifiable on the Hedera Mirror Node
- Not upvotes, not platform points — actual economic contribution

**Native VRS Swap**

- Get VRS with HBAR directly in the app via the VursoSwap contract

**LLM Training Data Marketplace**

- Every accepted bounty answer is a verified data point: human-written, economically staked, immutably recorded
- AI companies can license the Vurso dataset — revenue distributed proportionally to contributors on-chain
- If you have 10% of accepted answers, you earn 10% of every license sold. Automatically.

---

## Hedera Integration

| Service    | How Vurso Uses It                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HCS**    | Every question, answer, tip, acceptance, and AI agent action is a permanent on-chain message. Per-post dedicated discussion topics. No central database. |
| **HTS**    | VRS token — platform reward and tipping currency. Auto-associated on profile creation.                                                                   |
| **HSCS**   | `VursoBounty.sol` — trustless HBAR escrow. `VursoSwap.sol` — HBAR → VRS exchange. Deposit mechanic enforced on-chain.                                    |
| **HCS-10** | Vurso's AI agent is registered in the Hashgraph Online Registry. Detects duplicate questions and flags spam answers in real-time via gRPC.               |
| **HCS-11** | On-chain developer profiles. Account memo updated to `hcs11:{topicId}`. Portable across any platform that reads the standard.                            |

---

## The Delta — DevVault 2024 → Vurso 2026

This is the Legacy Builders track. Here is exactly what changed:

| DevVault 2024                | Vurso 2026                                                         |
| ---------------------------- | ------------------------------------------------------------------ |
| 1 HCS topic for all content  | Per-post dedicated discussion topics                               |
| Content capped at 1024 bytes | Full IPFS via Pinata for rich content                              |
| No bounty accountability     | Paid-to-answer deposit — self-regulating, fair                     |
| No AI/LLM split              | Free questions → AI answers. Bounty questions → human experts only |
| DVT token, basic transfers   | VRS token + swap contract + bounty escrow                          |
| No identity                  | HCS-11 profiles with account memo linking                          |
| No AI agent                  | HCS-10 agent (Hedera Agent Kit + Groq Llama 3.3 70B)               |
| No data monetisation         | LLM Training Data Marketplace with licensing tiers                 |
| No search                    | Real-time search across Questions + Updates feeds                  |

---

## Architecture

```
Frontend (Next.js)
    ├── Mirror Node API       — read questions, answers, profiles, balances
    ├── WalletConnect         — user wallet signing (HashPack, Blade, Kabila, any compatible)
    ├── IPFS (Pinata)         — long-form content (bypasses HCS 1024-byte limit)
    └── Hedera Network
            ├── QUESTIONS_TOPIC_ID   (0.0.8056232)
            ├── UPDATES_TOPIC_ID     (0.0.8056233)
            ├── Per-post discussion topics (one per question/update)
            ├── VRS Token            (0.0.8056228)
            ├── VursoBounty Contract (0.0.8061418)
            └── VursoSwap Contract   (0.0.8061421)

Background Services (auto-launched via Next.js instrumentation.ts)
    ├── AI Agent (HCS-10)     — real-time gRPC duplicate detection + spam flagging
    └── Swap Listener         — processes HBAR → VRS swap events
```

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Hedera**: `@hashgraph/sdk`, `hedera-agent-kit`, `@hashgraphonline/standards-sdk`
- **Wallet**: `@hashgraph/hedera-wallet-connect` (WalletConnect — HashPack, Blade, Kabila)
- **AI Agent**: LangChain + Groq (Llama 3.3 70B) registered via HCS-10
- **Smart Contracts**: Solidity 0.8.28, compiled with `solc`
- **Storage**: Pinata (IPFS)

---

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm
- A funded Hedera Testnet account

### 1. Clone & Install

```bash
git clone https://github.com/Freedteck/vurso
cd vurso
pnpm install
```

### 2. Create `.env.local`

```env
NEXT_PUBLIC_HEDERA_NETWORK=testnet

# Operator (Treasury / Admin account)
OPERATOR_ACCOUNT_ID=0.0.XXXXXX
OPERATOR_PRIVATE_KEY=0x...

# Hedera Topic & Token IDs (populated by setup script)
NEXT_PUBLIC_QUESTIONS_TOPIC_ID=
NEXT_PUBLIC_UPDATES_TOPIC_ID=
NEXT_PUBLIC_REGISTRY_TOPIC_ID=
NEXT_PUBLIC_ANNOUNCEMENTS_TOPIC_ID=
NEXT_PUBLIC_VRS_TOKEN_ID=

# Smart Contracts (populated by deploy script)
NEXT_PUBLIC_BOUNTY_CONTRACT_ID=
NEXT_PUBLIC_SWAP_CONTRACT_ID=

# AI Agent
GROQ_API_KEY=
AGENT_INBOUND_TOPIC_ID=
AGENT_OUTBOUND_TOPIC_ID=

# IPFS
NEXT_PUBLIC_PINATA_GATEWAY=
PINATA_JWT=

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Revalidation
REVALIDATION_SECRET=
NEXT_PUBLIC_REVALIDATION_SECRET=
```

### 3. Setup Hedera Infrastructure (first time only)

```bash
# Creates the VRS token, HCS topics, and updates .env.local automatically
pnpm run setup:hedera

# Deploys VursoBounty and VursoSwap smart contracts
pnpm run deploy:contracts
```

### 4. Start the Dev Server

```bash
pnpm dev
```

The AI Agent and Swap Listener start automatically alongside the Next.js server. No separate terminal windows needed.

Open [http://localhost:3000](http://localhost:3000).

---

## Why Would a Developer Use Vurso Instead of a Free LLM?

You wouldn't use Vurso for questions LLMs can already answer well. You would use it the third time an LLM gave you a confident wrong answer on the same production problem and your team is still blocked. That is when free stops being good enough.

Vurso exists for that moment. And every answer from that moment forward lives on-chain permanently — so the next developer who hits the same wall doesn't have to pay for it again.

See the full breakdown at `/why` in the live app.

---

## Project Structure

```
src/
├── app/               # Next.js App Router pages & API routes
├── components/        # UI components (cards, modals, layout)
├── lib/               # Core logic: hedera-sdk.ts, hedera-mirror.ts, agent-service.ts, swap-service.ts
├── instrumentation.ts # Launches AI Agent + Swap Listener on server boot
contracts/
├── VursoBounty.sol    # HBAR escrow: lockBounty, release, cancel
├── VursoSwap.sol      # HBAR → VRS swap at a fixed rate
scripts/
├── setup-hedera.mjs   # One-time infrastructure setup
├── deploy-contracts.mjs
├── ai-agent.mjs       # Standalone agent runner
└── swap-listener.mjs  # Standalone swap listener
```

---

## Live Demo

**App**: https://legislative-lark-freedteck-77552fdd.koyeb.app
**Demo Video**: [YouTube link]
**GitHub**: https://github.com/Freedteck/vurso

---

## License

MIT

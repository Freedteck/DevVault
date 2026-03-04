# Vurso

_formerly DevVault_

A decentralised knowledge-sharing platform for developers, built on Hedera.

Think of it as a Web3 Stack Overflow where knowledge has real monetary value — contributors are rewarded transparently by the community, every piece of content lives on an immutable ledger, and no single entity controls the database.

**Submitted to the [Hedera Hello Future Apex Hackathon 2026](https://hellofuturehackathon.dev) — Legacy Builders Track.**

---

## What It Does

Vurso has two content pillars:

- **The Den** — Developers ask technical questions, the community answers. The best answers get tipped in HBAR or VRS. Question askers can optionally lock a bounty (HBAR or VRS) that automatically releases to whoever gives the accepted answer.
- **Updates** — Developers share frameworks, industry news, and best practices with the community.

Every action — posting a question, submitting an answer, accepting a solution, tipping a contributor — is a real signed transaction on the Hedera network. There is no central database.

---

## Hedera Services Used

| Service                            | How Vurso Uses It                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| **HCS (Hedera Consensus Service)** | Questions, Updates, and per-post discussion threads each live on their own dedicated HCS topic |
| **HTS (Hedera Token Service)**     | VRS token (Vurso Token) — the platform's reward and tipping currency                           |
| **Hedera Smart Contracts**         | `VursoBounty.sol` (HBAR escrow) and `VursoSwap.sol` (HBAR → VRS exchange)                      |
| **HCS-10 (AI Agent Standard)**     | Vurso's Duplicate Detector is a fully-registered HCS-10 agent on the Hashgraph Online Registry |
| **HCS-11 (Profile Standard)**      | Developer identities are stored on-chain; account memos point to HCS-11 profile topics         |

---

## How It Works

**Posting a question:**

1. User fills out the question form (optionally sets a bounty)
2. Platform creates a dedicated HCS discussion topic for that question (server-side, one wallet popup saved)
3. If bounty: user signs `lockBountyHbar()` on the escrow contract
4. User signs one `TopicMessageSubmitTransaction` — question lands on Hedera
5. The AI Duplicate Detector detects the new message in real-time via gRPC subscription, checks the question against existing ones, and posts a similarity warning to the discussion topic if a match is found

**Accepting an answer:**

1. Asker clicks "Accept" on the best contribution
2. An `accept` message is posted to the discussion topic
3. If an HBAR bounty exists: `releaseBounty()` is called on `VursoBounty` — funds go directly to the answerer
4. If a VRS bounty exists: the platform operator releases VRS from treasury to the answerer

---

## Architecture

```
Frontend (Next.js)
    ├── Mirror Node API       — read questions, answers, profiles, balances
    ├── WalletConnect         — user wallet signing (HashConnect compatible)
    ├── IPFS (Pinata)         — long-form content storage (bypasses HCS 1024-byte limit)
    └── Hedera Network
            ├── QUESTIONS_TOPIC_ID   (0.0.8056232)
            ├── UPDATES_TOPIC_ID     (0.0.8056233)
            ├── Per-post discussion topics (one per question/update)
            ├── VRS Token            (0.0.8056228)
            ├── VursoBounty Contract (0.0.8061418)
            └── VursoSwap Contract   (0.0.8061421)

Background Services (auto-launched via Next.js instrumentation.ts)
    ├── AI Agent (HCS-10)     — real-time gRPC duplicate detection
    └── Swap Listener         — processes HBAR → VRS swap events
```

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Hedera**: `@hashgraph/sdk`, `hedera-agent-kit`, `@hashgraphonline/standards-sdk`
- **Wallet**: `@hashgraph/hedera-wallet-connect` (WalletConnect)
- **AI Agent**: LangChain + Groq (Llama 3.3 70B)
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
├── ai-agent.mjs       # Standalone agent runner (alternative to instrumentation)
└── swap-listener.mjs  # Standalone swap listener
```

---

## License

MIT

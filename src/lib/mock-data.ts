// Mock data for Vurso UI development
// Replace with real Hedera Mirror Node + IPFS fetches later

export type Tag = string;

export interface Author {
  accountId: string;
  displayName: string;
  vrsEarned: number;
  skills: string[];
}

export interface Question {
  id: string;
  sequenceNumber: number;
  title: string;
  body: string;
  tags: Tag[];
  author: Author;
  timestamp: string;
  answerCount: number;
  tipTotal: number; // total VRS tips received
  bountyAmount?: number;
  bountyCurrency?: "HBAR" | "VRS";
  accepted: boolean;
  discussionTopicId: string;
}

export interface Update {
  id: string;
  sequenceNumber: number;
  title: string;
  body: string;
  tags: Tag[];
  author: Author;
  timestamp: string;
  commentCount: number;
  tipTotal: number;
}

export interface Answer {
  sequenceNumber: number;
  body: string;
  author: Author;
  timestamp: string;
  tipTotal: number;
  isAccepted: boolean;
}

export interface Comment {
  sequenceNumber: number;
  body: string;
  author: Author;
  timestamp: string;
  tipTotal: number;
}

export interface LeaderboardEntry {
  rank: number;
  author: Author;
  acceptedAnswers: number;
  questionsAsked: number;
  score: number; // vrsEarned * 1 + acceptedAnswers * 10
}

// ─── Authors ──────────────────────────────────────────────────────

export const MOCK_AUTHORS: Author[] = [
  {
    accountId: "0.0.1234567",
    displayName: "freed.dev",
    vrsEarned: 4280,
    skills: ["Hedera", "React", "TypeScript", "Solidity"],
  },
  {
    accountId: "0.0.2345678",
    displayName: "hbarbuilder",
    vrsEarned: 3150,
    skills: ["Solidity", "EVM", "DeFi", "Python"],
  },
  {
    accountId: "0.0.3456789",
    displayName: "nodematrix",
    vrsEarned: 2740,
    skills: ["Node.js", "Rust", "Systems", "APIs"],
  },
  {
    accountId: "0.0.4567890",
    displayName: "chaincraft",
    vrsEarned: 1920,
    skills: ["Hedera", "HCS", "Next.js", "Go"],
  },
  {
    accountId: "0.0.5678901",
    displayName: "solveshift",
    vrsEarned: 890,
    skills: ["React", "CSS", "UX", "Testing"],
  },
];

// ─── Questions ────────────────────────────────────────────────────

export const MOCK_QUESTIONS: Question[] = [
  {
    id: "q-001",
    sequenceNumber: 1,
    title: "How do I avoid reentrancy vulnerabilities in Hedera EVM contracts?",
    body: `I've been deploying Solidity contracts on Hedera's EVM and noticed that the typical reentrancy patterns from Ethereum still apply. What's the recommended approach — OpenZeppelin's ReentrancyGuard, CEI pattern, or something specific to the Hedera environment?

I've read that Hedera's architecture provides some inherent protections but I'm not sure if that removes the requirement for manual guards.`,
    tags: ["Solidity", "Hedera", "Security", "EVM"],
    author: MOCK_AUTHORS[1],
    timestamp: "2026-02-26T10:14:00Z",
    answerCount: 4,
    tipTotal: 320,
    bountyAmount: 100,
    bountyCurrency: "VRS",
    accepted: true,
    discussionTopicId: "0.0.9876501",
  },
  {
    id: "q-002",
    sequenceNumber: 2,
    title: "Best way to paginate HCS topic messages from the Mirror Node?",
    body: `When fetching messages from a Hedera Consensus Service topic via the Mirror Node REST API, I'm hitting the 100-message limit per page. What's the most efficient way to handle pagination without pulling all messages into memory?

I'm in a Next.js app and using fetch with async/await.`,
    tags: ["HCS", "Mirror Node", "Hedera", "Next.js"],
    author: MOCK_AUTHORS[3],
    timestamp: "2026-02-25T14:32:00Z",
    answerCount: 2,
    tipTotal: 75,
    accepted: false,
    discussionTopicId: "0.0.9876502",
  },
  {
    id: "q-003",
    sequenceNumber: 3,
    title:
      "TypeScript types for @hashgraph/sdk — any maintained third-party definitions?",
    body: `The official SDK ships with its own types but they're incomplete in some places, especially around AccountId and ContractId interop. Has anyone built or found a maintained DefinitelyTyped package or a type augmentation pattern?`,
    tags: ["TypeScript", "Hedera SDK", "Types"],
    author: MOCK_AUTHORS[4],
    timestamp: "2026-02-24T09:00:00Z",
    answerCount: 1,
    tipTotal: 40,
    bountyAmount: 2,
    bountyCurrency: "HBAR",
    accepted: false,
    discussionTopicId: "0.0.9876503",
  },
  {
    id: "q-004",
    sequenceNumber: 4,
    title:
      "Atomic HBAR + HTS token transfer in one transaction — is it possible?",
    body: `I want to swap HBAR for a custom HTS token in a single atomic transaction so neither side can fail without the other. Is this achievable natively in Hedera, or does it require a smart contract to mediate?`,
    tags: ["HTS", "HBAR", "Atomic Swap", "Hedera"],
    author: MOCK_AUTHORS[2],
    timestamp: "2026-02-23T16:45:00Z",
    answerCount: 3,
    tipTotal: 220,
    bountyAmount: 50,
    bountyCurrency: "HBAR",
    accepted: true,
    discussionTopicId: "0.0.9876504",
  },
  {
    id: "q-005",
    sequenceNumber: 5,
    title:
      "How to subscribe to HCS topic messages in real-time from a browser?",
    body: `Mirror Node has a REST API but I want near-real-time updates in the browser without polling every second. I've seen mention of WebSocket or gRPC stream support. What's the recommended approach for a React app?`,
    tags: ["HCS", "WebSocket", "React", "Real-time"],
    author: MOCK_AUTHORS[0],
    timestamp: "2026-02-22T11:20:00Z",
    answerCount: 2,
    tipTotal: 150,
    accepted: false,
    discussionTopicId: "0.0.9876505",
  },
];

// ─── Updates ──────────────────────────────────────────────────────

export const MOCK_UPDATES: Update[] = [
  {
    id: "u-001",
    sequenceNumber: 1,
    title:
      "Hedera Agent Kit v0.4 released — HCS-10 agent registration now stable",
    body: `The Hedera Agent Kit just dropped v0.4 and it finally ships stable HCS-10 agent registration out of the box. You can register an AI agent in the HOL Registry in about 15 lines of code now. The new openConvAIStandardClient handles handshakes automatically.

Worth upgrading if you're building anything agent-related. The changelog is detailed.`,
    tags: ["Hedera", "AI Agents", "HCS-10", "SDK"],
    author: MOCK_AUTHORS[0],
    timestamp: "2026-02-27T08:00:00Z",
    commentCount: 7,
    tipTotal: 410,
  },
  {
    id: "u-002",
    sequenceNumber: 2,
    title: "Why I switched from Firestore to HCS for my app's data layer",
    body: `Six months ago I would have laughed at the idea of using a consensus service as a primary database. Now I'm convinced it's the right call for certain apps — especially those where "who said what and when" is the product.

Here's a breakdown of what changed my mind and what the actual tradeoffs look like in production.`,
    tags: ["HCS", "Architecture", "Decentralisation"],
    author: MOCK_AUTHORS[2],
    timestamp: "2026-02-26T15:00:00Z",
    commentCount: 14,
    tipTotal: 680,
  },
  {
    id: "u-003",
    sequenceNumber: 3,
    title:
      "Next.js 16 ships with native partial prerendering — what this means for dApps",
    body: `Next.js 16 landed this week and the headline feature is stable Partial Prerendering (PPR). For a decentralized app that reads from an external API (like Hedera's Mirror Node), this changes how you structure your data fetching significantly.

TL;DR: static shell, streaming dynamic content = best of both worlds.`,
    tags: ["Next.js", "Performance", "dApps"],
    author: MOCK_AUTHORS[3],
    timestamp: "2026-02-25T10:30:00Z",
    commentCount: 5,
    tipTotal: 290,
  },
];

// ─── Leaderboard ──────────────────────────────────────────────────

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    author: MOCK_AUTHORS[0],
    acceptedAnswers: 31,
    questionsAsked: 12,
    score: 4280 + 31 * 10,
  },
  {
    rank: 2,
    author: MOCK_AUTHORS[1],
    acceptedAnswers: 22,
    questionsAsked: 8,
    score: 3150 + 22 * 10,
  },
  {
    rank: 3,
    author: MOCK_AUTHORS[2],
    acceptedAnswers: 18,
    questionsAsked: 21,
    score: 2740 + 18 * 10,
  },
  {
    rank: 4,
    author: MOCK_AUTHORS[3],
    acceptedAnswers: 11,
    questionsAsked: 17,
    score: 1920 + 11 * 10,
  },
  {
    rank: 5,
    author: MOCK_AUTHORS[4],
    acceptedAnswers: 4,
    questionsAsked: 6,
    score: 890 + 4 * 10,
  },
];

// ─── Platform Stats ───────────────────────────────────────────────

export const MOCK_STATS = {
  totalQuestions: 148,
  totalUpdates: 63,
  totalAnswers: 412,
  vrsCirculating: 184_200,
  hbarInBounties: 312.5,
  activeContributors: 94,
};
// ─── Answers ──────────────────────────────────────────────────────

export const MOCK_ANSWERS: Record<string, Answer[]> = {
  "q-001": [
    {
      sequenceNumber: 1,
      body: `The CEI (Check-Effects-Interactions) pattern is your best friend here. On Hedera, while the consensus layer is different, the EVM logic stays the same regarding state updates. Always update your internal balance before calling an external contract.

Also, OpenZeppelin's \`ReentrancyGuard\` works perfectly fine on Hedera and is highly recommended as a standard safety net.`,
      author: MOCK_AUTHORS[0],
      timestamp: "2026-02-26T11:05:00Z",
      tipTotal: 120,
      isAccepted: true,
    },
    {
      sequenceNumber: 2,
      body: `One thing specific to Hedera: if you're using HTS (Hedera Token Service) within your Solidity contract via precompiles, be aware of how associations work. Reentrancy isn't just about HBAR; it can happen during token transfers if the receiver's fallback is triggered.`,
      author: MOCK_AUTHORS[2],
      timestamp: "2026-02-26T12:40:00Z",
      tipTotal: 45,
      isAccepted: false,
    },
  ],
  "q-002": [
    {
      sequenceNumber: 1,
      body: `You should use the \`links.next\` field returned in the Mirror Node API response. It contains the URL for the next page of results.

Example:
\`\`\`javascript
const response = await fetch('.../api/v1/topics/0.0.123/messages?limit=100');
const data = await response.json();
const nextBatch = data.links?.next;
\`\`\`
This way you only fetch what you need when the user scrolls or clicks "Load More".`,
      author: MOCK_AUTHORS[1],
      timestamp: "2026-02-25T16:20:00Z",
      tipTotal: 30,
      isAccepted: false,
    },
  ],
};

// ─── Comments ─────────────────────────────────────────────────────

export const MOCK_COMMENTS: Record<string, Comment[]> = {
  "u-001": [
    {
      sequenceNumber: 1,
      body: `This is huge for the agent ecosystem! Finally some standardization on HCS. Can't wait to see what people build for the Apex hackathon with this.`,
      author: MOCK_AUTHORS[2],
      timestamp: "2026-02-27T09:15:00Z",
      tipTotal: 15,
    },
    {
      sequenceNumber: 2,
      body: `Does v0.4 support multi-sig for agent registration? I'm working with a DAO that needs to control the agent's identity.`,
      author: MOCK_AUTHORS[3],
      timestamp: "2026-02-27T10:30:00Z",
      tipTotal: 5,
    },
  ],
  "u-002": [
    {
      sequenceNumber: 1,
      body: `I've been on this journey too. The latency on Firestore was killing our UX. HCS feels much more snappy once you get the indexing right on your local cache.`,
      author: MOCK_AUTHORS[4],
      timestamp: "2026-02-26T16:45:00Z",
      tipTotal: 25,
    },
  ],
};

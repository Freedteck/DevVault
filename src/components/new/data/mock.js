/**
 * Mock Data for DevVault Apex UI Revamp
 * 
 * Why: To decouple UI development from Web3 integration and backend latency.
 * This allows for rapid iteration on the "Pro" aesthetic.
 */

export const MOCK_USERS = {
  currentUser: {
    accountId: "0.0.123456",
    username: "crypto_wizard",
    avatar: "https://i.pravatar.cc/150?u=crypto_wizard",
    balance: "1,250.00",
    rank: "Legend",
    reputation: {
      score: 850,
      acceptanceCount: 42,
      tier: "Legend"
    },
    badges: ["Top Solver", "Early Adopter"]
  },
  users: [
    {
      accountId: "0.0.887766",
      username: "solidity_sage",
      avatar: "https://i.pravatar.cc/150?u=solidity_sage",
      rank: "Expert",
      reputation: {
        score: 420,
        acceptanceCount: 8,
        tier: "Expert"
      },
      badges: []
    },
    {
      accountId: "0.0.991122",
      username: "hedera_hero",
      avatar: "https://i.pravatar.cc/150?u=hedera_hero",
      rank: "Contributor",
      reputation: {
        score: 150,
        acceptanceCount: 3,
        tier: "Contributor"
      },
      badges: []
    }
  ]
};

export const MOCK_QUESTIONS = [
  {
    id: "q-1",
    title: "How to implement Hedera Token Service (HTS) in a React Native app?",
    description: "I'm trying to mint a token using the JS SDK in a React Native environment (Expo), but I keep getting buffer errors. Has anyone solved this polyfill issue? I've tried react-native-get-random-values but it persists.",
    author: MOCK_USERS.users[0],
    bounty: 500, // HBAR
    tags: ["HTS", "React Native", "SDK"],
    createdAt: "2024-02-14T10:00:00Z",
    stats: {
      views: 125,
      answers: 3,
      likes: 12
    },
    isSolved: false,
    codeSnippet: `import { Client, TokenCreateTransaction } from "@hashgraph/sdk";\n\nconst client = Client.forTestnet();\n// Error happens here...`
  },
  {
    id: "q-2",
    title: "Best practices for upgrading smart contracts on Hedera without losing state?",
    description: "I have a deployed contract managing user registries. I need to add a new function but keep the data. Should I use a proxy pattern (EIP-1967) or Hedera's file service update capabilities?",
    author: MOCK_USERS.users[1],
    bounty: 1500,
    tags: ["Smart Contracts", "Solidity", "Architecture"],
    createdAt: "2024-02-13T15:30:00Z",
    stats: {
      views: 340,
      answers: 8,
      likes: 45
    },
    isSolved: true,
    solvedBy: MOCK_USERS.users[0]
  },
  {
    id: "q-3",
    title: "Error: 'Transaction over max size' when submitting large topic messages",
    description: "I'm using HCS to store JSON metadata. It works for small objects, but fails when the base64 string exceeds 4kb. Do I need to implement chunking manually? I read about HCS chunking but the SDK seems to behave inconsistently when `maxChunks` is not set explicitly. Any code examples?",
    author: MOCK_USERS.users[1],
    bounty: 100,
    tags: ["HCS", "Topic Message", "Debugging"],
    createdAt: "2024-02-12T09:15:00Z",
    stats: {
      views: 89,
      answers: 1,
      likes: 5
    },
    isSolved: false
  },
  {
    id: "q-4",
    title: "Implementing a Unity WebGL wallet connection for a P2E game",
    description: "We are building an FPS on Hedera. We need to sign transactions from within the Unity WebGL build. HashConnect seems to be the way to go, but the IFrames are blocking the pairing event on iOS Safari. Is there a workaround or a specific specific modal configuration required for mobile support?",
    author: MOCK_USERS.users[0],
    bounty: 2500,
    tags: ["Gaming", "Unity", "HashConnect", "Mobile"],
    createdAt: "2024-02-11T14:20:00Z",
    stats: {
      views: 1205,
      answers: 12,
      likes: 67
    },
    isSolved: true
  },
  {
    id: "q-5",
    title: "Atomic Swaps between HBAR and HTS tokens using Smart Contract vs Native Swap",
    description: "I am designing a DEX. I want to minimize fees. Should I wrap HBAR to WHBAR and use a standard Uniswap v2 fork contract, or can I utilize the native Hedera Token Service atomic swap features to achieve creating a liquidity pool without smart contracts?",
    author: MOCK_USERS.users[1],
    bounty: 600,
    tags: ["DeFi", "DEX", "Architecture"],
    createdAt: "2024-02-10T16:45:00Z",
    stats: {
      views: 450,
      answers: 5,
      likes: 23
    },
    isSolved: false
  }
];

export const MOCK_UPDATES = [
  {
    id: "u-1",
    title: "Hedera Council approves HIP-402 for streaming payments!",
    description: "This is a game changer for real-time services. We can now implement per-second billing directly on L1.",
    author: MOCK_USERS.users[0],
    tags: ["Governance", "HIP-402", "News"],
    createdAt: "2024-02-14T08:00:00Z",
    likes: 88
  },
  {
    id: "u-2",
    title: "DevVault v2.0 Roadmap Released",
    description: "Check out the new features coming next month: AI Agents, Live Help, and more.",
    author: MOCK_USERS.users[1],
    tags: ["Meta", "Announcement"],
    createdAt: "2024-02-10T12:00:00Z",
    likes: 150
  }
];

export const MOCK_LEADERBOARD = [
  { rank: 1, ...MOCK_USERS.users[0], score: 9850, accountId: "0.0.887766" },
  { rank: 2, ...MOCK_USERS.users[1], score: 7200, accountId: "0.0.991122" },
  { rank: 3, ...MOCK_USERS.users[0], score: 6400, username: "algo_expert", accountId: "0.0.111222" },
  { rank: 4, ...MOCK_USERS.users[1], score: 5100, username: "web3_builder", accountId: "0.0.333444" },
  { rank: 5, ...MOCK_USERS.users[0], score: 4300, username: "contract_auditor", accountId: "0.0.555666" },
];

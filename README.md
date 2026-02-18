# DevVault

A decentralized developer platform built on Hedera that rewards knowledge sharing and fosters collaboration. DevVault combines Q&A functionality with content sharing, powered by blockchain-based incentives and secure data storage.

## 🚀 What's New in Ascension (November 2025)

This project was previously submitted to **Hedera Hello Future 2.0** (October 2024). The following **significant improvements** were made during the **Ascension hackathon period** (November 3-21, 2025):

### Architecture & Scalability
- **5 Separate HCS Topics**: Migrated from a single filtered topic to dedicated topics for Questions, Updates, Answers, Comments, and Acceptances - eliminating frontend filtering complexity and enabling true scalability
- **Fixed Pagination**: Implemented proper Mirror Node API pagination using `nextLink` for efficient data loading and chunk reassembly for large messages

### Smart Contract Integration
- **Bounty Escrow System**: Developed and deployed `BountyEscrow.sol` smart contract for secure HBAR bounty management
- **Deposit/Release Flows**: Integrated escrow deposit on question creation and automatic release on answer acceptance
- **Payment Guarantees**: Eliminated trust issues by locking funds in smart contracts until solutions are verified

### NFT Reputation System
- **4-Tier Achievement Badges**: Implemented Helper (1+ acceptances), Contributor (3+), Expert (5+), and Legend (10+) badge tiers
- **Soulbound NFTs**: Created non-transferable badges using `TokenFreezeTransaction` to prevent gaming the reputation system
- **Universal Badge Display**: Built `UserWithBadge` component that displays earned badges across all user interactions (questions, answers, comments, leaderboard)
- **Visual Trust Indicators**: Users can immediately identify reputable developers through badge tier colors and icons

### Answer Acceptance Mechanism
- **Acceptance Tracking**: Created dedicated HCS topic for recording answer acceptances with question author verification
- **Reputation Building**: Linked acceptances to both escrow release and NFT badge eligibility
- **Authorization Controls**: Only question authors can accept answers, preventing abuse

### Enhanced Leaderboard
- **Rebuilt Ranking Algorithm**: Changed from simple contribution count to acceptance-based + DVT earned ranking
- **Real-time Acceptance Queries**: Integrated `useUserAcceptanceCount` hook for live reputation tracking
- **Badge Tier Visualization**: Leaderboard now displays user badge tiers for instant credibility assessment

### Production Readiness
- **Comprehensive Error Handling**: Added graceful error states for all blockchain operations
- **Loading States**: Implemented proper async operation feedback across all user interactions
- **Testing Infrastructure**: Added Vitest and React Testing Library for quality assurance
- **Responsive Design**: Enhanced mobile and tablet experience

**Result**: Transformed from a basic Q&A prototype into a production-ready developer economy with verifiable reputation, guaranteed payments, and scalable architecture.


## Overview

DevVault is a decentralized application (dApp) that enables developers to ask questions, share technical updates, and receive token-based rewards for valuable contributions. Built on Hedera's high-performance distributed ledger, it creates a transparent and incentivized ecosystem for developer collaboration.

## Core Features

### 1. Dual Content System

- **Q&A Platform**: Developers can ask technical questions and provide answers with best responses highlighted through acceptance system
- **Updates & Resources**: Share technical updates, best practices, frameworks, tools, and industry insights

### 2. Token-Based Tipping System

- Tip developers for valuable posts, answers, or comments using DVT tokens or HBAR
- Tipping available for original content and associated comments/answers
- Direct peer-to-peer rewards through Hedera Token Service

### 3. Comments & Discussions

- Threaded discussions on all posts (questions and updates)
- Enable deeper technical conversations and additional insights
- Comments can also receive tips for engagement

### 4. Leaderboard & Recognition

- Contributor rankings based on accepted answers and tokens earned
- NFT achievement badges for milestones
- Transparent recognition system

### 5. Decentralized Data Storage

- All content stored on Hedera Consensus Service (HCS) topics
- Immutable, timestamped records of all interactions
- Transparent access to complete discussion threads

### 6. Advanced Blockchain Features

- **Escrow System**: Smart contract-based bounty management for questions
- **Wallet Integration**: HashPack wallet connection with user profiles
- **Multi-Topic Architecture**: Separate HCS topics for questions, answers, updates, acceptances, and token transfers

## Technical Architecture

### Frontend

- **React 18** with modern hooks and context patterns
- **Vite** for fast development and optimized builds
- **React Router** for client-side navigation
- **CSS Modules** for component-scoped styling
- **React Hot Toast** for notifications

### Blockchain Integration

- **Hedera Consensus Service (HCS)**: Decentralized data storage across multiple topics
- **Hedera Token Service**: DVT token creation, minting, and transfers
- **Smart Contracts**: Escrow functionality for bounty management
- **HashPack Wallet**: User authentication and transaction signing

### Data Structure

- **Questions Topic**: Stores question posts with metadata
- **Answers Topic**: Stores responses and comments
- **Updates Topic**: Stores technical updates and resources
- **Acceptances Topic**: Tracks accepted answers for leaderboard
- **Token Transfers Topic**: Records all tipping transactions

## Value Proposition

**For Developers:**

- Earn DVT tokens and HBAR for sharing knowledge and helping peers
- Build reputation through leaderboard rankings and NFT badges
- Access transparent, immutable record of contributions

**For Teams & Organizations:**

- Identify top technical contributors for hiring
- Stay updated on industry trends and best practices
- Leverage decentralized expertise network

**For the Community:**

- Sustainable incentivized ecosystem for technical collaboration
- Transparent reward system encouraging quality contributions
- Cross-organizational knowledge sharing

## Getting Started

### Prerequisites

- Node.js 18+
- HashPack wallet for Hedera testnet
- HBAR for gas fees and initial DVT tokens

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Freedteck/DevVault.git
cd DevVault
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:
   Create a `.env` file with the following variables:

```env
VITE_TOKEN_ID=your_dvt_token_id
VITE_ESCROW_CONTRACT_ID=your_escrow_contract_id
VITE_QUESTIONS_TOPIC_ID=your_questions_topic_id
VITE_ANSWERS_TOPIC_ID=your_answers_topic_id
VITE_UPDATES_TOPIC_ID=your_updates_topic_id
VITE_ACCEPTANCES_TOPIC_ID=your_acceptances_topic_id
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Deployment

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage

1. **Connect Wallet**: Link your HashPack wallet to access the platform
2. **Ask Questions**: Post technical questions with optional HBAR bounties
3. **Share Updates**: Publish technical insights, tutorials, or industry news
4. **Provide Answers**: Help fellow developers and earn tips
5. **Tip Contributions**: Reward valuable content with DVT tokens
6. **Accept Answers**: Mark helpful responses to build contributor reputation

## Technologies Used

### Frontend

- React 18.3.1
- Vite 5.4.1
- React Router DOM 6.26.1
- Lucide React (icons)
- React Hot Toast 2.6.0

### Blockchain

- @hashgraph/sdk 2.14.2
- hashconnect 0.1.7
- solc 0.8.30 (Solidity compiler)

### Development Tools

- ESLint 9.9.0
- Vitest 2.0.5
- @testing-library/react 16.0.0

## Hedera Integration Details

DevVault leverages multiple Hedera services:

- **Consensus Service**: Timestamped, immutable data storage
- **Token Service**: Custom DVT token for rewards and tipping
- **Smart Contracts**: Escrow functionality for bounty management
- **Mirror Node API**: Query historical data and transactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Vision

DevVault aims to become the premier decentralized platform for developer collaboration, creating a sustainable ecosystem where technical knowledge is valued, shared, and rewarded through blockchain-based incentives.

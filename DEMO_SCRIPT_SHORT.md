# DevVault Demo Script (Submission Version - 3 Minutes)

## Overview
**Target Duration:** 2:45 - 3:00
**Focus:** Legacy Track Improvements (Escrow, Reputation, Architecture)
**Tone:** Fast, professional, technical.

---

### [0:00-0:30] The Problem & The Evolution
**Visual:** Split screen. Left side: "Old DevVault". Right side: "New DevVault".
**Voiceover:** "In our first version, DevVault was just a concept for decentralized Q&A. Today, for the Ascension Legacy Track, we present a completely re-architected platform that solves the two biggest problems in developer communities: Trust and Incentives."

**Visual:** Zoom into the "New DevVault" architecture diagram (HCS + Smart Contracts).
**Voiceover:** "We've moved from a simple message board to a robust Hedera-native ecosystem, leveraging the Consensus Service, Token Service, and Smart Contracts to create a true knowledge economy."

### [0:30-1:15] Feature 1: Trustless Bounties (The Escrow)
**Visual:** User clicking "Ask Question". Highlights "Bounty: 100 HBAR".
**Voiceover:** "The biggest addition is our Trustless Bounty system. Previously, tips were just promises. Now, we use a custom Solidity smart contract to secure rewards."

**Visual:** Show HashScan transaction of the `deposit` function.
**Voiceover:** "When I post this question, 100 HBAR is instantly locked in the `BountyEscrow` contract. It's not in my wallet, and it's not in the admin's wallet. It's on-chain, guaranteeing the answerer gets paid."

### [1:15-2:00] Feature 2: Soulbound Reputation (The Resume)
**Visual:** Profile page showing a "Gold Contributor" badge.
**Voiceover:** "Reputation shouldn't just be a number in a database. In DevVault Ascension, reputation is minted as Soulbound NFTs."

**Visual:** Show the "Minting..." process and the resulting NFT on HashScan with the "Frozen" status.
**Voiceover:** "When my answer is accepted, the system automatically mints a tiered badge. Notice this transaction—the NFT is frozen immediately. I can't sell this badge. I can't transfer it. It is a permanent, on-chain proof of my expertise that I can take to any other Hedera dApp."

### [2:00-2:30] Feature 3: Scalable Architecture (HCS)
**Visual:** Scrolling down the "Questions" feed. Infinite scroll loading more items.
**Voiceover:** "Under the hood, we've solved the pagination issues of our MVP. We now use a multi-topic architecture on the Hedera Consensus Service, separating Questions, Answers, and Updates into distinct streams."

**Visual:** Briefly show the code `useHCSData.js` handling the `nextLink`.
**Voiceover:** "This allows for infinite scalability and real-time updates via the Mirror Node, ensuring the platform feels as fast as Web2, with the security of Web3."

### [2:30-3:00] Conclusion
**Visual:** "DevVault" Logo and "Legacy Track" text.
**Voiceover:** "DevVault Ascension isn't just an update; it's a new standard for developer collaboration. We've turned a simple Q&A site into a secure, reputation-based economy. Thank you."

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * DevVault Bounty Contract
 *
 * Deployed on Hedera Smart Contract Service (HSCS).
 *
 * Flow:
 *   1. Question asker calls lockHbar() with native HBAR value.
 *   2. When an answer is accepted off-chain (verified by HCS ACCEPT message),
 *      the original asker calls release() to pay the answerer.
 *   3. Alternatively, the asker can cancel() to reclaim their bounty.
 *
 * Trust model:
 *   - Only the original depositor can release or cancel.
 *   - There is no oracle — the UI verifies the HCS ACCEPT message and
 *     presents the release button to the asker.
 *   - Future upgrade: add a multi-sig release after oracle validates the HCS message.
 */
contract DevVaultBounty {
    struct Bounty {
        address payable depositor;
        uint256 amount; // tinybars (1 HBAR = 100,000,000 tinybars on Hedera)
        bool released;
        bool cancelled;
    }

    // bountyId is keccak256(questionTopicId, questionSequenceNumber)
    mapping(bytes32 => Bounty) public bounties;

    event BountyLocked(
        bytes32 indexed bountyId,
        address indexed depositor,
        uint256 amount
    );
    event BountyReleased(
        bytes32 indexed bountyId,
        address indexed recipient,
        uint256 amount
    );
    event BountyCancelled(
        bytes32 indexed bountyId,
        address indexed depositor,
        uint256 amount
    );

    /// @notice Lock HBAR as a bounty for a question.
    /// @param topicId HCS discussion topic ID string (e.g. "0.0.8056232")
    /// @param sequenceNumber The QUESTION message sequence number
    function lockHbar(
        string calldata topicId,
        uint256 sequenceNumber
    ) external payable {
        require(msg.value > 0, "No HBAR sent");
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        require(bounties[bountyId].depositor == address(0), "Bounty exists");

        bounties[bountyId] = Bounty({
            depositor: payable(msg.sender),
            amount: msg.value,
            released: false,
            cancelled: false
        });

        emit BountyLocked(bountyId, msg.sender, msg.value);
    }

    /// @notice Release the bounty to the answerer.
    ///         Only callable by the original depositor.
    /// @param topicId HCS discussion topic ID string
    /// @param sequenceNumber The QUESTION message sequence number
    /// @param recipient The answerer's Hedera EVM address
    function release(
        string calldata topicId,
        uint256 sequenceNumber,
        address payable recipient
    ) external {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        Bounty storage b = bounties[bountyId];

        require(b.depositor == msg.sender, "Not depositor");
        require(!b.released, "Already released");
        require(!b.cancelled, "Already cancelled");
        require(recipient != address(0), "Zero recipient");

        b.released = true;
        uint256 amount = b.amount;

        // 3% platform fee
        uint256 fee = amount / 33; // ~3.03%
        uint256 payout = amount - fee;

        (bool sent, ) = recipient.call{value: payout}("");
        require(sent, "Transfer failed");
        // Fee stays in contract — owner can sweep
        emit BountyReleased(bountyId, recipient, payout);
    }

    /// @notice Cancel and refund the bounty to the depositor.
    /// @param topicId HCS discussion topic ID string
    /// @param sequenceNumber The QUESTION message sequence number
    function cancel(
        string calldata topicId,
        uint256 sequenceNumber
    ) external {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        Bounty storage b = bounties[bountyId];

        require(b.depositor == msg.sender, "Not depositor");
        require(!b.released, "Already released");
        require(!b.cancelled, "Already cancelled");

        b.cancelled = true;
        uint256 amount = b.amount;
        (bool sent, ) = b.depositor.call{value: amount}("");
        require(sent, "Refund failed");

        emit BountyCancelled(bountyId, msg.sender, amount);
    }

    /// @notice Get bounty info for a question.
    function getBounty(
        string calldata topicId,
        uint256 sequenceNumber
    )
        external
        view
        returns (
            address depositor,
            uint256 amount,
            bool released,
            bool cancelled
        )
    {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        Bounty storage b = bounties[bountyId];
        return (b.depositor, b.amount, b.released, b.cancelled);
    }

    /// @notice Owner sweep of accumulated fees.
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function sweepFees() external {
        require(msg.sender == owner, "Not owner");
        (bool sent, ) = payable(owner).call{value: address(this).balance}("");
        require(sent, "Sweep failed");
    }

    receive() external payable {}
}

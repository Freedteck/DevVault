// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BountyEscrow {
    struct Escrow {
        address depositor;
        uint256 amount;
        address recipient;
        bool released;
        uint256 createdAt;
    }

    mapping(uint256 => Escrow) public escrows;
    address public owner;

    event Deposited(uint256 indexed questionId, address indexed depositor, uint256 amount);
    event Released(uint256 indexed questionId, address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Deposit HBAR into escrow for a question
    function deposit(uint256 questionId) external payable {
        require(msg.value > 0, "Must deposit some HBAR");
        require(escrows[questionId].amount == 0, "Escrow already exists for this question");

        escrows[questionId] = Escrow({
            depositor: msg.sender,
            amount: msg.value,
            recipient: address(0), // Will be set when released
            released: false,
            createdAt: block.timestamp
        });

        emit Deposited(questionId, msg.sender, msg.value);
    }

    // Release escrow funds to recipient (only owner can call this)
    function release(uint256 questionId, address recipient) external onlyOwner {
        Escrow storage escrow = escrows[questionId];
        require(escrow.amount > 0, "No escrow found for this question");
        require(!escrow.released, "Escrow already released");
        require(recipient != address(0), "Invalid recipient");

        escrow.recipient = recipient;
        escrow.released = true;

        // Transfer HBAR to recipient
        payable(recipient).transfer(escrow.amount);

        emit Released(questionId, recipient, escrow.amount);
    }

    // Get escrow details
    function getEscrow(uint256 questionId) external view returns (
        address depositor,
        uint256 amount,
        address recipient,
        bool released,
        uint256 createdAt
    ) {
        Escrow memory escrow = escrows[questionId];
        return (
            escrow.depositor,
            escrow.amount,
            escrow.recipient,
            escrow.released,
            escrow.createdAt
        );
    }

    // Get contract HBAR balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
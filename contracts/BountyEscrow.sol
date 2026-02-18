// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IHederaTokenService {
    function transferToken(address token, address sender, address receiver, int64 amount) external returns (int responseCode);
    function cryptoTransfer(TransferList memory transferList, TokenTransferList[] memory tokenTransfers) external returns (int responseCode);
}

struct AccountAmount {
    address accountID;
    int64 amount;
    bool isApproval;
}

struct TransferList {
    AccountAmount[] transfers;
}

struct TokenTransferList {
    address token;
    AccountAmount[] transfers;
    NftTransfer[] nftTransfers;
}

struct NftTransfer {
    address senderAccountID;
    address receiverAccountID;
    int64 serialNumber;
    bool isApproval;
}

contract BountyEscrow {
    IHederaTokenService constant HTS = IHederaTokenService(0x0000000000000000000000000000000000000167);
    struct Escrow {
        address depositor;
        uint256 amount;
        address recipient;
        bool released;
        uint256 createdAt;
        bool arbitrated;
    }

    mapping(uint256 => Escrow) public escrows;
    address public owner;
    address public aiArbiter;
    uint256 public constant ARBITRATION_TIMEOUT = 7 days;

    event Deposited(uint256 indexed questionId, address indexed depositor, uint256 amount);
    event Released(uint256 indexed questionId, address indexed recipient, uint256 amount, bool arbitrated);
    event ArbiterUpdated(address indexed oldArbiter, address indexed newArbiter);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == aiArbiter, "Only AI arbiter can call this function");
        _;
    }

    constructor(address _aiArbiter) {
        owner = msg.sender;
        aiArbiter = _aiArbiter;
    }

    // Deposit HBAR into escrow for a question
    function deposit(uint256 questionId) external payable {
        require(msg.value > 0, "Must deposit some HBAR");
        require(escrows[questionId].amount == 0, "Escrow already exists for this question");

        escrows[questionId] = Escrow({
            depositor: msg.sender,
            amount: msg.value,
            recipient: address(0),
            released: false,
            createdAt: block.timestamp,
            arbitrated: false
        });

        emit Deposited(questionId, msg.sender, msg.value);
    }

    // Release escrow funds to recipient (owner or depositor can call)
    function release(uint256 questionId, address recipient) external {
        Escrow storage escrow = escrows[questionId];
        require(escrow.amount > 0, "No escrow found for this question");
        require(!escrow.released, "Escrow already released");
        require(recipient != address(0), "Invalid recipient");
        require(
            msg.sender == owner || msg.sender == escrow.depositor,
            "Only owner or depositor can release"
        );

        escrow.recipient = recipient;
        escrow.released = true;
        uint256 amount = escrow.amount;

        // Transfer HBAR using direct transfer (contract already holds the HBAR)
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "HBAR transfer failed");

        emit Released(questionId, recipient, amount, false);
    }

    // AI arbiter releases funds after timeout (7 days)
    function arbiterRelease(uint256 questionId, address recipient) external onlyArbiter {
        Escrow storage escrow = escrows[questionId];
        require(escrow.amount > 0, "No escrow found for this question");
        require(!escrow.released, "Escrow already released");
        require(recipient != address(0), "Invalid recipient");
        require(
            block.timestamp >= escrow.createdAt + ARBITRATION_TIMEOUT,
            "Arbitration timeout not reached"
        );

        escrow.recipient = recipient;
        escrow.released = true;
        escrow.arbitrated = true;
        uint256 amount = escrow.amount;

        // Transfer HBAR using direct transfer (contract already holds the HBAR)
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "HBAR transfer failed");

        emit Released(questionId, recipient, amount, true);
    }

    // Update AI arbiter address
    function updateArbiter(address _newArbiter) external onlyOwner {
        require(_newArbiter != address(0), "Invalid arbiter address");
        address oldArbiter = aiArbiter;
        aiArbiter = _newArbiter;
        emit ArbiterUpdated(oldArbiter, _newArbiter);
    }

    // Check if escrow is eligible for arbitration
    function isEligibleForArbitration(uint256 questionId) external view returns (bool) {
        Escrow memory escrow = escrows[questionId];
        if (escrow.amount == 0 || escrow.released) {
            return false;
        }
        return block.timestamp >= escrow.createdAt + ARBITRATION_TIMEOUT;
    }

    // Get time remaining until arbitration
    function getTimeUntilArbitration(uint256 questionId) external view returns (uint256) {
        Escrow memory escrow = escrows[questionId];
        if (escrow.amount == 0 || escrow.released) {
            return 0;
        }
        
        uint256 arbitrationTime = escrow.createdAt + ARBITRATION_TIMEOUT;
        if (block.timestamp >= arbitrationTime) {
            return 0;
        }
        
        return arbitrationTime - block.timestamp;
    }

    // Get escrow details
    function getEscrow(uint256 questionId) external view returns (
        address depositor,
        uint256 amount,
        address recipient,
        bool released,
        uint256 createdAt,
        bool arbitrated
    ) {
        Escrow memory escrow = escrows[questionId];
        return (
            escrow.depositor,
            escrow.amount,
            escrow.recipient,
            escrow.released,
            escrow.createdAt,
            escrow.arbitrated
        );
    }

    // Get contract HBAR balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
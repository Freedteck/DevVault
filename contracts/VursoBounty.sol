// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ─── Hedera Token Service Precompile Interface ─────────────────────────────────
// Precompile address on Hedera: 0x0000000000000000000000000000000000000167
interface IHederaTokenService {
    /// @dev Transfers tokens between accounts. Both must be associated.
    ///      Returns 22 (SUCCESS) on success.
    function transferToken(
        address token,
        address sender,
        address receiver,
        int64 amount
    ) external returns (int64 responseCode);

    /// @dev Associates this contract (or any account) with an HTS token
    ///      so it can hold that token.
    ///      Returns 22 (SUCCESS) on success.
    function associateToken(
        address account,
        address token
    ) external returns (int64 responseCode);
}

/**
 * Vurso Bounty Contract v4
 *
 * Deployed on Hedera Smart Contract Service (HSCS).
 *
 * Supports both HBAR and VRS (HTS) bounties held in trustless escrow.
 *
 * HBAR flow:
 *   1. lockHbar()         — HBAR deposited directly to contract.
 *   2. depositToAnswer()  — answerers lock 1% deposit ("skin in the game").
 *   3. release()          — asker or operator releases bounty + refunds winner deposit.
 *   4. refundDeposit()    — operator refunds a non-winning valid answerer's deposit.
 *   5. slashDeposit()     — operator slashes a spam / AI-hallucinated answerer's deposit.
 *   6. cancel()           — asker reclaims HBAR bounty (all deposits must be refunded first).
 *
 * Deposit economics:
 *   - Winner:              deposit refunded + bounty paid.
 *   - Valid non-winners:   deposit refunded via refundDeposit().
 *   - Spam / malicious:    deposit burned to owner via slashDeposit().
 *
 * VRS (HTS) flow (unchanged from v3):
 *   1. Asker calls VRS token approve() via HTS precompile (wallet-side).
 *   2. lockVRS() — contract pulls approved VRS from asker via HTS precompile.
 *      VRS is now held in the contract (not the operator wallet).
 *   3. releaseVRS() — asker or operator transfers VRS to answerer via HTS precompile.
 *   4. cancelVRS() — asker reclaims VRS bounty via HTS precompile.
 *
 * IMPORTANT: Before lockVRS() can succeed, this contract's Hedera account must
 *            be associated with the VRS token. Run the setup script once after
 *            deployment: `node scripts/associate-contract-vrs.mjs`
 */
contract VursoBounty {
    address constant HTS_PRECOMPILE = 0x0000000000000000000000000000000000000167;
    int64 constant HTS_SUCCESS = 22;

    struct Bounty {
        address payable depositor;
        uint256 amount; // tinybars for HBAR
        bool released;
        bool cancelled;
    }

    struct VRSBounty {
        address depositor;
        address tokenAddress; // EVM address of VRS token
        int64 amount; // VRS units (2 decimals, e.g. 5000 = 50 VRS)
        bool released;
        bool cancelled;
    }

    // bountyId = keccak256(topicId, sequenceNumber)
    mapping(bytes32 => Bounty) public bounties;
    mapping(bytes32 => VRSBounty) public vrsBounties;
    mapping(bytes32 => mapping(address => uint256)) public answerDeposits;

    address public operator;
    address public owner;

    // ─── Events ────────────────────────────────────────────────────────────────

    event BountyLocked(bytes32 indexed bountyId, address indexed depositor, uint256 amount);
    event BountyReleased(bytes32 indexed bountyId, address indexed recipient, uint256 payout, uint256 depositRefunded);
    event BountyCancelled(bytes32 indexed bountyId, address indexed depositor, uint256 amount);
    event AnswerDeposited(bytes32 indexed bountyId, address indexed answerer, uint256 amount);
    event DepositRefunded(bytes32 indexed bountyId, address indexed answerer, uint256 amount);
    event DepositSlashed(bytes32 indexed bountyId, address indexed answerer, uint256 amount);
    event VRSBountyLocked(bytes32 indexed bountyId, address indexed depositor, address token, int64 amount);
    event VRSBountyReleased(bytes32 indexed bountyId, address indexed recipient, int64 amount);
    event VRSBountyCancelled(bytes32 indexed bountyId, address indexed depositor, int64 amount);

    // ─── Constructor ────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        operator = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── HBAR Bounty Functions (unchanged from v2) ─────────────────────────────

    function lockHbar(string calldata topicId, uint256 sequenceNumber) external payable {
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

    function depositToAnswer(string calldata topicId, uint256 sequenceNumber) external payable {
        require(msg.value > 0, "No deposit sent");
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        Bounty storage b = bounties[bountyId];
        require(b.depositor != address(0), "No bounty for this question");
        require(!b.released, "Bounty already released");
        require(!b.cancelled, "Bounty cancelled");

        uint256 minDeposit = b.amount / 100;
        if (minDeposit < 10_000_000) minDeposit = 10_000_000;
        require(msg.value >= minDeposit, "Deposit too low");

        answerDeposits[bountyId][msg.sender] += msg.value;
        emit AnswerDeposited(bountyId, msg.sender, msg.value);
    }

    function release(string calldata topicId, uint256 sequenceNumber, address payable recipient) external {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        Bounty storage b = bounties[bountyId];

        require(msg.sender == b.depositor || msg.sender == operator, "Not authorised");
        require(!b.released, "Already released");
        require(!b.cancelled, "Already cancelled");
        require(recipient != address(0), "Zero recipient");

        b.released = true;
        uint256 amount = b.amount;
        uint256 fee = amount / 33;
        uint256 payout = amount - fee;

        uint256 depositRefund = answerDeposits[bountyId][recipient];
        if (depositRefund > 0) {
            answerDeposits[bountyId][recipient] = 0;
        }

        (bool sent, ) = recipient.call{value: payout + depositRefund}("");
        require(sent, "Transfer failed");
        emit BountyReleased(bountyId, recipient, payout, depositRefund);
    }

    function cancel(string calldata topicId, uint256 sequenceNumber) external {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        Bounty storage b = bounties[bountyId];

        require(b.depositor == msg.sender, "Not depositor");
        require(!b.released, "Already released");
        require(!b.cancelled, "Already cancelled");

        b.cancelled = true;
        (bool sent, ) = b.depositor.call{value: b.amount}("");
        require(sent, "Refund failed");
        emit BountyCancelled(bountyId, msg.sender, b.amount);
    }

    // ─── VRS (HTS) Bounty Functions ────────────────────────────────────────────

    /**
     * @notice Lock VRS tokens as a bounty.
     *         The caller must have approved this contract to spend `amount` VRS
     *         via the HTS precompile BEFORE calling this function.
     * @param topicId     HCS discussion topic ID string
     * @param sequenceNumber  Question sequence number
     * @param tokenAddress    EVM address of the VRS token
     * @param amount          VRS amount in smallest units (2 decimals: 50 VRS = 5000)
     */
    function lockVRS(
        string calldata topicId,
        uint256 sequenceNumber,
        address tokenAddress,
        int64 amount
    ) external {
        require(amount > 0, "Zero amount");
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        require(vrsBounties[bountyId].depositor == address(0), "VRS bounty exists");

        // Pull VRS from caller into this contract via HTS precompile
        int64 code = IHederaTokenService(HTS_PRECOMPILE).transferToken(
            tokenAddress,
            msg.sender,    // from
            address(this), // to (contract holds VRS)
            amount
        );
        require(code == HTS_SUCCESS, "VRS transfer failed");

        vrsBounties[bountyId] = VRSBounty({
            depositor: msg.sender,
            tokenAddress: tokenAddress,
            amount: amount,
            released: false,
            cancelled: false
        });
        emit VRSBountyLocked(bountyId, msg.sender, tokenAddress, amount);
    }

    /**
     * @notice Release VRS bounty to the accepted answerer.
     *         Callable by depositor or platform operator.
     */
    function releaseVRS(
        string calldata topicId,
        uint256 sequenceNumber,
        address recipient
    ) external {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        VRSBounty storage vb = vrsBounties[bountyId];

        require(msg.sender == vb.depositor || msg.sender == operator, "Not authorised");
        require(!vb.released, "Already released");
        require(!vb.cancelled, "Already cancelled");
        require(recipient != address(0), "Zero recipient");

        vb.released = true;

        // 3% fee stays in contract (swept by owner)
        int64 fee = vb.amount / 33;
        int64 payout = vb.amount - fee;

        int64 code = IHederaTokenService(HTS_PRECOMPILE).transferToken(
            vb.tokenAddress,
            address(this), // from (contract)
            recipient,     // to (answerer)
            payout
        );
        require(code == HTS_SUCCESS, "VRS release failed");

        emit VRSBountyReleased(bountyId, recipient, payout);
    }

    /**
     * @notice Cancel VRS bounty — returns VRS to the original depositor.
     */
    function cancelVRS(string calldata topicId, uint256 sequenceNumber) external {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        VRSBounty storage vb = vrsBounties[bountyId];

        require(vb.depositor == msg.sender, "Not depositor");
        require(!vb.released, "Already released");
        require(!vb.cancelled, "Already cancelled");

        vb.cancelled = true;

        int64 code = IHederaTokenService(HTS_PRECOMPILE).transferToken(
            vb.tokenAddress,
            address(this),
            vb.depositor,
            vb.amount
        );
        require(code == HTS_SUCCESS, "VRS refund failed");

        emit VRSBountyCancelled(bountyId, vb.depositor, vb.amount);
    }

    // ─── Deposit Management ─────────────────────────────────────────────────────

    /**
     * @notice Refund the deposit of a valid non-winning answerer.
     *         Called by the operator after a bounty is released to the winner.
     *         Only valid deposits (non-zero) are refundable.
     * @param topicId        HCS discussion topic ID string
     * @param sequenceNumber Question sequence number
     * @param answerer       Address of the answerer to refund
     */
    function refundDeposit(
        string calldata topicId,
        uint256 sequenceNumber,
        address payable answerer
    ) external {
        require(msg.sender == operator || msg.sender == owner, "Not authorised");
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        uint256 depositAmount = answerDeposits[bountyId][answerer];
        require(depositAmount > 0, "No deposit to refund");

        answerDeposits[bountyId][answerer] = 0;
        (bool sent, ) = answerer.call{value: depositAmount}("");
        require(sent, "Refund transfer failed");
        emit DepositRefunded(bountyId, answerer, depositAmount);
    }

    /**
     * @notice Slash (burn to owner) the deposit of a spam or malicious answerer.
     *         Callable by the operator or owner when an answer is flagged as
     *         spam, AI-hallucinated garbage, or otherwise malicious.
     * @param topicId        HCS discussion topic ID string
     * @param sequenceNumber Question sequence number
     * @param answerer       Address of the answerer whose deposit to slash
     */
    function slashDeposit(
        string calldata topicId,
        uint256 sequenceNumber,
        address answerer
    ) external {
        require(msg.sender == operator || msg.sender == owner, "Not authorised");
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        uint256 depositAmount = answerDeposits[bountyId][answerer];
        require(depositAmount > 0, "No deposit to slash");

        answerDeposits[bountyId][answerer] = 0;
        // Transfer slashed deposit to owner (platform treasury)
        (bool sent, ) = payable(owner).call{value: depositAmount}("");
        require(sent, "Slash transfer failed");
        emit DepositSlashed(bountyId, answerer, depositAmount);
    }

    // ─── View Functions ─────────────────────────────────────────────────────────

    function getBounty(string calldata topicId, uint256 sequenceNumber)
        external view
        returns (address depositor, uint256 amount, bool released, bool cancelled)
    {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        Bounty storage b = bounties[bountyId];
        return (b.depositor, b.amount, b.released, b.cancelled);
    }

    function getVRSBounty(string calldata topicId, uint256 sequenceNumber)
        external view
        returns (address depositor, address tokenAddress, int64 amount, bool released, bool cancelled)
    {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        VRSBounty storage vb = vrsBounties[bountyId];
        return (vb.depositor, vb.tokenAddress, vb.amount, vb.released, vb.cancelled);
    }

    function getRequiredDeposit(string calldata topicId, uint256 sequenceNumber)
        external view returns (uint256 depositTinybars)
    {
        bytes32 bountyId = keccak256(abi.encodePacked(topicId, sequenceNumber));
        Bounty storage b = bounties[bountyId];
        if (b.depositor == address(0)) return 0;
        uint256 d = b.amount / 100;
        return d < 10_000_000 ? 10_000_000 : d;
    }

    // ─── Admin ──────────────────────────────────────────────────────────────────

    function setOperator(address newOperator) external onlyOwner {
        operator = newOperator;
    }

    /**
     * @notice Associate this contract with an HTS token so it can hold it.
     *         Call ONCE after deployment with the VRS token EVM address.
     *         Only callable by owner.
     * @param tokenAddress EVM address of VRS token
     */
    function selfAssociate(address tokenAddress) external onlyOwner {
        int64 code = IHederaTokenService(HTS_PRECOMPILE).associateToken(
            address(this),
            tokenAddress
        );
        // 22 = SUCCESS, 194 = TOKEN_ALREADY_ASSOCIATED (both OK)
        require(code == 22 || code == 194, "Self-associate failed");
    }

    function sweepFees() external onlyOwner {
        (bool sent, ) = payable(owner).call{value: address(this).balance}("");
        require(sent, "HBAR sweep failed");
    }

    receive() external payable {}
}

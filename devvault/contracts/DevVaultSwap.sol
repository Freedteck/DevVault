// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * DevVault DVT Swap Contract
 *
 * Deployed on Hedera Smart Contract Service (HSCS).
 *
 * Allows users to swap HBAR for DVT at a fixed rate set by the platform.
 * The contract is pre-loaded with DVT token balance by the treasury.
 *
 * IMPORTANT: On Hedera, HTS token transfers via HSCS require the
 * IHederaTokenService precompile (0x167). This contract uses the
 * standard approach of calling the precompile for token transfers.
 *
 * For the hackathon testnet, we use a simplified model:
 *   - Users send HBAR to this contract
 *   - Off-chain: the platform monitors SwapRequested events and manually
 *     transfers DVT to the user (server-side with operator key)
 *   - HBAR is held in contract until the platform sweeps it
 *
 * This avoids the complexity of HTS precompile calls while demonstrating
 * the economic model during the hackathon demo.
 *
 * Note: A production version would use the IHederaTokenService precompile
 * to atomically swap HBAR → DVT on-chain.
 */
contract DevVaultSwap {
    address public owner;

    /// @notice Exchange rate: DVT per 1 HBAR (at 8 decimal HBAR precision)
    /// Default: 92 DVT per 1 HBAR (1 DVT ≈ 0.0109 HBAR)
    uint256 public dvtPerHbar = 92;

    /// @notice Minimum swap: 0.1 HBAR (in tinybars: 10_000_000)
    uint256 public minSwapTinybars = 10_000_000;

    event SwapRequested(
        address indexed user,
        uint256 hbarAmount, // tinybars
        uint256 dvtAmount,  // whole DVT units (2 decimals)
        string hederaAccountId // Hedera native account ID for DVT transfer
    );

    event RateUpdated(uint256 newRate);
    event Swept(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Swap HBAR for DVT.
    /// @param hederaAccountId The user's Hedera account ID (e.g. "0.0.12345")
    ///        so the platform knows where to send DVT off-chain.
    function swap(string calldata hederaAccountId) external payable {
        require(msg.value >= minSwapTinybars, "Below minimum swap");
        require(bytes(hederaAccountId).length > 0, "No account ID");

        // Calculate DVT amount (msg.value is in tinybars = 1e-8 HBAR)
        // dvtAmount (2 decimals) = (tinybars / 1e8) * dvtPerHbar * 100
        uint256 dvtAmount = (msg.value * dvtPerHbar * 100) / 1e8;
        require(dvtAmount > 0, "DVT amount too small");

        emit SwapRequested(msg.sender, msg.value, dvtAmount, hederaAccountId);
    }

    /// @notice Preview DVT amount for a given HBAR input.
    /// @param tinybars Amount in tinybars (1 HBAR = 1e8 tinybars)
    function quote(uint256 tinybars) external view returns (uint256 dvtAmount) {
        return (tinybars * dvtPerHbar * 100) / 1e8;
    }

    /// @notice Update the DVT/HBAR rate.
    function setRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Zero rate");
        dvtPerHbar = newRate;
        emit RateUpdated(newRate);
    }

    /// @notice Withdraw accumulated HBAR.
    function sweep() external onlyOwner {
        uint256 bal = address(this).balance;
        payable(owner).transfer(bal);
        emit Swept(owner, bal);
    }

    receive() external payable {}
}

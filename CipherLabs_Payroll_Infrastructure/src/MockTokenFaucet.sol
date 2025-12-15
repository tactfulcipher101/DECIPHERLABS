// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockTokenFaucet
 * @notice Distributes test tokens to new users for testing purposes
 * @dev Intended for testnet usage only.
 */
contract MockTokenFaucet is Ownable {
    // Token contracts
    IERC20 public stableToken;
    IERC20 public volatileToken;

    // Distribution amounts (with 18 decimals)
    uint256 public stableAmount = 100000 * 10 ** 18; // 100,000 stable tokens
    uint256 public volatileAmount = 500000 * 10 ** 18; // 500,000 volatile tokens

    // Cooldown period to prevent spam (24 hours)
    uint256 public cooldownPeriod = 1 days;

    // Track last claim time for each address
    mapping(address => uint256) public lastClaimTime;

    // Events
    event TokensClaimed(
        address indexed recipient,
        uint256 stableAmount,
        uint256 volatileAmount
    );
    event FaucetFunded(
        address indexed funder,
        uint256 stableAmount,
        uint256 volatileAmount
    );
    event DistributionAmountsUpdated(
        uint256 newStableAmount,
        uint256 newVolatileAmount
    );
    event CooldownPeriodUpdated(uint256 newCooldownPeriod);

    constructor(
        address _stableToken,
        address _volatileToken
    ) Ownable(msg.sender) {
        require(_stableToken != address(0), "Invalid stable token");
        require(_volatileToken != address(0), "Invalid volatile token");

        stableToken = IERC20(_stableToken);
        volatileToken = IERC20(_volatileToken);
    }

    /**
     * @notice Claim test tokens from the faucet
     * @dev No cooldown - users can claim anytime for testing
     */
    function claimTokens() external {
        // Check faucet has enough tokens
        require(
            stableToken.balanceOf(address(this)) >= stableAmount,
            "Insufficient stable tokens in faucet"
        );
        require(
            volatileToken.balanceOf(address(this)) >= volatileAmount,
            "Insufficient volatile tokens in faucet"
        );

        // Update last claim time (for tracking purposes only)
        lastClaimTime[msg.sender] = block.timestamp;

        // Transfer tokens
        require(
            stableToken.transfer(msg.sender, stableAmount),
            "Stable token transfer failed"
        );
        require(
            volatileToken.transfer(msg.sender, volatileAmount),
            "Volatile token transfer failed"
        );

        emit TokensClaimed(msg.sender, stableAmount, volatileAmount);
    }

    /**
     * @notice Check if an address can claim tokens
     * @param user Address to check
     * @return eligible Whether the user can claim (always true - no cooldown)
     * @return timeUntilNextClaim Seconds until next claim (always 0 - no cooldown)
     */
    function canClaim(
        address user
    ) external view returns (bool eligible, uint256 timeUntilNextClaim) {
        // No cooldown - always return true
        return (true, 0);
    }

    /**
     * @notice Fund the faucet with tokens
     * @param _stableAmount Amount of stable tokens to add
     * @param _volatileAmount Amount of volatile tokens to add
     */
    function fundFaucet(
        uint256 _stableAmount,
        uint256 _volatileAmount
    ) external {
        if (_stableAmount > 0) {
            require(
                stableToken.transferFrom(
                    msg.sender,
                    address(this),
                    _stableAmount
                ),
                "Stable token transfer failed"
            );
        }

        if (_volatileAmount > 0) {
            require(
                volatileToken.transferFrom(
                    msg.sender,
                    address(this),
                    _volatileAmount
                ),
                "Volatile token transfer failed"
            );
        }

        emit FaucetFunded(msg.sender, _stableAmount, _volatileAmount);
    }

    /**
     * @notice Update distribution amounts (owner only)
     * @param _stableAmount New stable token amount per claim
     * @param _volatileAmount New volatile token amount per claim
     */
    function setDistributionAmounts(
        uint256 _stableAmount,
        uint256 _volatileAmount
    ) external onlyOwner {
        require(_stableAmount > 0, "Stable amount must be > 0");
        require(_volatileAmount > 0, "Volatile amount must be > 0");

        stableAmount = _stableAmount;
        volatileAmount = _volatileAmount;

        emit DistributionAmountsUpdated(_stableAmount, _volatileAmount);
    }

    /**
     * @notice Update cooldown period (owner only)
     * @param _cooldownPeriod New cooldown period in seconds
     */
    function setCooldownPeriod(uint256 _cooldownPeriod) external onlyOwner {
        require(_cooldownPeriod > 0, "Cooldown must be > 0");
        cooldownPeriod = _cooldownPeriod;
        emit CooldownPeriodUpdated(_cooldownPeriod);
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
    }

    /**
     * @notice Get faucet balance
     * @return stableBalance Balance of stable tokens
     * @return volatileBalance Balance of volatile tokens
     */
    function getFaucetBalance()
        external
        view
        returns (uint256 stableBalance, uint256 volatileBalance)
    {
        return (
            stableToken.balanceOf(address(this)),
            volatileToken.balanceOf(address(this))
        );
    }
}

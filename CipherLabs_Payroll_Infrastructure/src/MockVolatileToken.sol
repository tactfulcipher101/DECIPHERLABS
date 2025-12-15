// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockVolatileToken
 * @dev A mock volatile token (like ETH/WBTC equivalent) for testing hedge vault functionality
 * This simulates a volatile cryptocurrency for the hedge vault to manage risk
 * DO NOT USE IN PRODUCTION - Only for testing
 */
contract MockVolatileToken is ERC20 {
    constructor() ERC20("Mock Ethereum", "mETH") {
        // Mint 1 million tokens to the deployer for testing purposes
        _mint(msg.sender, 1_000_000 * 10**18); // 1M tokens with 18 decimals
    }

    /**
     * @notice Mint additional tokens (only for testing purposes)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens (for testing purposes)
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @notice Burn tokens from a specific address (for testing purposes)
     * @param account Address to burn from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }
}
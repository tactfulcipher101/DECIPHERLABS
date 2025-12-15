// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockStablecoin
 * @dev A mock stablecoin for testing the DeCipherLabs payroll system
 * This is a basic ERC20 token that mints 1 million tokens to the deployer
 * DO NOT USE IN PRODUCTION - Only for testing
 */
contract MockStablecoin is ERC20 {
    constructor() ERC20("Mock USD Coin", "mUSDC") {
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
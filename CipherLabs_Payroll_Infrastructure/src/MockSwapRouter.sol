// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ISwapRouter.sol";

/**
 * @title MockSwapRouter
 * @notice Mock implementation of Uniswap V3 SwapRouter for testing
 * @dev Performs 1:1 token swaps without actual price discovery
 * This is used for testnet where we don't have real Uniswap pools
 * For mainnet, we use the actual Uniswap V3 SwapRouter
 */
contract MockSwapRouter is ISwapRouter {
    using SafeERC20 for IERC20;

    event Swap(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed recipient
    );

    /**
     * @notice Performs a mock token swap at 1:1 ratio
     * @dev This is a simplified version for testing. In production, use real Uniswap V3
     * @param params Swap parameters
     * @return amountOut Amount of tokens received (same as amountIn for 1:1 swap)
     */
    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable override returns (uint256 amountOut) {
        require(params.amountIn > 0, "Amount must be greater than 0");
        require(params.tokenIn != params.tokenOut, "Cannot swap same token");
        require(params.recipient != address(0), "Invalid recipient");

        // Transfer tokenIn from sender to this contract
        IERC20(params.tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            params.amountIn
        );

        // For mock swap, use 1:1 ratio
        // In production, this would be determined by the pool price
        amountOut = params.amountIn;

        // Check if we have enough tokenOut
        uint256 balance = IERC20(params.tokenOut).balanceOf(address(this));
        require(balance >= amountOut, "Insufficient liquidity");

        // Transfer tokenOut to recipient
        IERC20(params.tokenOut).safeTransfer(params.recipient, amountOut);

        emit Swap(
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            params.recipient
        );

        return amountOut;
    }

    /**
     * @notice Allows owner to fund the router with tokens for swaps
     * @dev In production, this isn't needed as Uniswap uses pools
     */
    function fundRouter(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Emergency function to recover tokens
     */
    function recoverTokens(
        address token,
        uint256 amount,
        address recipient
    ) external {
        IERC20(token).safeTransfer(recipient, amount);
    }
}

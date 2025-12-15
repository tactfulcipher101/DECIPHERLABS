// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/DeCipherLabsPayrollFactory.sol";
import "../src/HedgeVaultManager.sol";
import "../src/MockStablecoin.sol";
import "../src/MockVolatileToken.sol";
import "../src/MockSwapRouter.sol";
import "../src/MockTokenFaucet.sol";

contract DeployDeCipherLabsWithMocks is Script {
    function run() external {
        vm.startBroadcast();

        console.log(
            "Deploying DeCipherLabs Infrastructure with Mock Tokens..."
        );

        // Deploy mock stablecoin for testing (would be real USDC/DAI in production)
        MockStablecoin mockStablecoin = new MockStablecoin();
        console.log("Mock stablecoin deployed at:", address(mockStablecoin));

        // Deploy mock volatile token for testing hedge vault functionality (would be ETH/WBTC in production)
        MockVolatileToken mockVolatileToken = new MockVolatileToken();
        console.log(
            "Mock volatile token deployed at:",
            address(mockVolatileToken)
        );

        // Mint additional tokens for faucet and other distributions
        // MockStablecoin/MockVolatileToken mint 1M by default, we need more
        mockStablecoin.mint(msg.sender, 100_000_000 * 10 ** 18); // Mint 100M more
        mockVolatileToken.mint(msg.sender, 100_000_000 * 10 ** 18); // Mint 100M more
        console.log("Minted additional tokens for distributions");

        // Deploy MockSwapRouter for testnet swaps
        MockSwapRouter swapRouter = new MockSwapRouter();
        console.log("MockSwapRouter deployed at:", address(swapRouter));

        // Fund swap router with tokens for swaps (1:1 ratio)
        uint256 swapLiquidity = 100000 * 10 ** 18; // 100,000 of each token
        mockStablecoin.transfer(address(swapRouter), swapLiquidity);
        mockVolatileToken.transfer(address(swapRouter), swapLiquidity);
        console.log("Funded swap router with liquidity");

        // Deploy HedgeVaultManager (Phase 1 MVP feature)
        HedgeVaultManager hedgeVaultManager = new HedgeVaultManager();
        console.log(
            "HedgeVaultManager deployed at:",
            address(hedgeVaultManager)
        );

        // Initialize the HedgeVaultManager first
        address FEE_RECIPIENT = msg.sender; // Use deployer as fee recipient

        hedgeVaultManager.initialize(
            address(mockStablecoin), // default stable token
            FEE_RECIPIENT, // fee recipient
            address(0) // factory (will be set later)
        );
        console.log(
            "HedgeVaultManager initialized with stable token:",
            address(mockStablecoin)
        );
        console.log("HedgeVaultManager fee recipient:", FEE_RECIPIENT);

        // Deploy Factory contract
        DeCipherLabsPayrollFactory factory = new DeCipherLabsPayrollFactory();
        console.log("Factory deployed at:", address(factory));

        // Initialize the factory contract
        address TREASURY_WALLET = msg.sender; // Use deployer as treasury for testing

        // Initialize the factory
        factory.initialize(
            TREASURY_WALLET, // treasury
            100, // 1% fee (100 basis points)
            address(hedgeVaultManager) // hedge vault manager (Phase 1 MVP feature)
        );
        console.log("Factory initialized with treasury:", TREASURY_WALLET);
        console.log("Factory fee set to 1%%");
        console.log("HedgeVaultManager set to:", address(hedgeVaultManager));

        // Set swap router on HedgeVaultManager
        hedgeVaultManager.setSwapRouter(address(swapRouter));
        console.log("Swap router configured on HedgeVaultManager");

        // Set factory on HedgeVaultManager
        hedgeVaultManager.setFactory(address(factory));
        console.log("Factory set on HedgeVaultManager");
        console.log("Swap router configured on HedgeVaultManager");

        // Test deploying a company payroll through the factory
        address COMPANY_OWNER = msg.sender; // For testing, use deployer as company owner
        address TAX_RECIPIENT = address(0); // Initially disable tax

        address testPayroll;
        try factory.deployCompanyPayroll(COMPANY_OWNER, TAX_RECIPIENT) returns (
            address payrollAddr
        ) {
            testPayroll = payrollAddr;
            console.log("Test payroll deployed at:", payrollAddr);
        } catch Error(string memory reason) {
            console.log("Test deployment failed with reason:", reason);
        } catch {
            console.log("Test deployment failed with unknown error");
        }
        // Distribute mock tokens to the company owner (person deploying the payroll) for immediate testing
        address companyOwner = COMPANY_OWNER; // Use the company owner who deployed the payroll

        uint256 stableAmount = 100000 * 10 ** 18; // 100,000 stable tokens with 18 decimals
        uint256 volatileAmount = 500000 * 10 ** 18; // 500,000 volatile tokens with 18 decimals

        // Transfer tokens to company owner for testing
        try mockStablecoin.transfer(companyOwner, stableAmount) {
            console.log(
                "Sent %s stable tokens to company owner %s",
                stableAmount,
                companyOwner
            );
        } catch {
            console.log(
                "Failed to send stable tokens to company owner %s",
                companyOwner
            );
        }
        try mockVolatileToken.transfer(companyOwner, volatileAmount) {
            console.log(
                "Sent %s volatile tokens to company owner %s",
                volatileAmount,
                companyOwner
            );
        } catch {
            console.log(
                "Failed to send volatile tokens to company owner %s",
                companyOwner
            );
        }
        // Fund HedgeVaultManager with both tokens for hedge vault operations
        uint256 hedgeVaultStableAmount = 50000 * 10 ** 18; // 50,000 stable tokens
        uint256 hedgeVaultVolatileAmount = 25000 * 10 ** 18; // 25,000 volatile tokens

        try
            mockStablecoin.transfer(
                address(hedgeVaultManager),
                hedgeVaultStableAmount
            )
        {
            console.log(
                "Funded HedgeVaultManager with %s stable tokens",
                hedgeVaultStableAmount
            );
        } catch {
            console.log("Failed to fund HedgeVaultManager with stable tokens");
        }
        try
            mockVolatileToken.transfer(
                address(hedgeVaultManager),
                hedgeVaultVolatileAmount
            )
        {
            console.log(
                "Funded HedgeVaultManager with %s volatile tokens",
                hedgeVaultVolatileAmount
            );
        } catch {
            console.log(
                "Failed to fund HedgeVaultManager with volatile tokens"
            );
        }
        // Deploy Token Faucet for easy test token distribution
        MockTokenFaucet faucet = new MockTokenFaucet(
            address(mockStablecoin),
            address(mockVolatileToken)
        );
        console.log("Token Faucet deployed at:", address(faucet));

        // Fund the faucet with a large amount of tokens
        uint256 faucetStableFunding = 10000000 * 10 ** 18; // 10,000,000 stable tokens
        uint256 faucetVolatileFunding = 50000000 * 10 ** 18; // 50,000,000 volatile tokens

        mockStablecoin.transfer(address(faucet), faucetStableFunding);
        mockVolatileToken.transfer(address(faucet), faucetVolatileFunding);
        console.log("Funded faucet with test tokens");
        console.log(
            "Users can claim 100,000 mUSDC and 500,000 mETH anytime (no cooldown)"
        );

        vm.stopBroadcast();

        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Mock Stablecoin:", address(mockStablecoin));
        console.log("Mock Volatile Token:", address(mockVolatileToken));
        console.log("MockSwapRouter:", address(swapRouter));
        console.log("Factory Contract:", address(factory));
        console.log("HedgeVaultManager Contract:", address(hedgeVaultManager));
        console.log("Token Faucet:", address(faucet));
        console.log("Test Payroll Contract:", testPayroll);
        console.log("Treasury:", TREASURY_WALLET);
        console.log("===========================");
        console.log("");
        console.log(
            "IMPORTANT: New users should claim test tokens from the faucet!"
        );
        console.log("Faucet Address:", address(faucet));
    }
}

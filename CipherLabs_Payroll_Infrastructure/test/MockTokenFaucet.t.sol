// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MockTokenFaucet.sol";
import "../src/MockStablecoin.sol";
import "../src/MockVolatileToken.sol";

contract MockTokenFaucetTest is Test {
    MockTokenFaucet public faucet;
    MockStablecoin public stableToken;
    MockVolatileToken public volatileToken;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    uint256 public constant STABLE_AMOUNT = 100000 * 10 ** 18;
    uint256 public constant VOLATILE_AMOUNT = 500000 * 10 ** 18;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy tokens
        stableToken = new MockStablecoin();
        volatileToken = new MockVolatileToken();

        // Mint additional tokens to owner for faucet funding
        // MockStablecoin mints 1M by default, we need 10M total
        stableToken.mint(owner, 9000000 * 10 ** 18); // Mint 9M more (total 10M)
        // MockVolatileToken mints 1M by default, we need 5M total
        volatileToken.mint(owner, 4000000 * 10 ** 18); // Mint 4M more (total 5M)

        // Deploy faucet
        faucet = new MockTokenFaucet(
            address(stableToken),
            address(volatileToken)
        );

        // Fund faucet
        stableToken.transfer(address(faucet), 10000000 * 10 ** 18); // 10M stable
        volatileToken.transfer(address(faucet), 5000000 * 10 ** 18); // 5M volatile (enough for 10 claims)

        vm.stopPrank();
    }

    function testInitialState() public {
        assertEq(address(faucet.stableToken()), address(stableToken));
        assertEq(address(faucet.volatileToken()), address(volatileToken));
        assertEq(faucet.stableAmount(), STABLE_AMOUNT);
        assertEq(faucet.volatileAmount(), VOLATILE_AMOUNT);
        assertEq(faucet.cooldownPeriod(), 1 days);
    }

    function testClaimTokens() public {
        vm.startPrank(user1);

        // Check initial balances
        assertEq(stableToken.balanceOf(user1), 0);
        assertEq(volatileToken.balanceOf(user1), 0);

        // Claim tokens
        faucet.claimTokens();

        // Check balances after claim
        assertEq(stableToken.balanceOf(user1), STABLE_AMOUNT);
        assertEq(volatileToken.balanceOf(user1), VOLATILE_AMOUNT);

        vm.stopPrank();
    }

    function testCanClaimMultipleTimes() public {
        vm.startPrank(user1);

        // First claim should succeed
        faucet.claimTokens();

        // Second claim should also succeed (no cooldown)
        faucet.claimTokens();

        // Check balances (should have 2x the amount)
        assertEq(stableToken.balanceOf(user1), STABLE_AMOUNT * 2);
        assertEq(volatileToken.balanceOf(user1), VOLATILE_AMOUNT * 2);

        vm.stopPrank();
    }

    function testCanClaimImmediatelyAfterFirst() public {
        vm.startPrank(user1);

        // First claim
        faucet.claimTokens();

        // Second claim immediately (no need to wait)
        faucet.claimTokens();

        // Check balances (should have 2x the amount)
        assertEq(stableToken.balanceOf(user1), STABLE_AMOUNT * 2);
        assertEq(volatileToken.balanceOf(user1), VOLATILE_AMOUNT * 2);

        vm.stopPrank();
    }

    function testMultipleUsersClaim() public {
        // User 1 claims
        vm.prank(user1);
        faucet.claimTokens();

        // User 2 claims
        vm.prank(user2);
        faucet.claimTokens();

        // Check balances
        assertEq(stableToken.balanceOf(user1), STABLE_AMOUNT);
        assertEq(volatileToken.balanceOf(user1), VOLATILE_AMOUNT);
        assertEq(stableToken.balanceOf(user2), STABLE_AMOUNT);
        assertEq(volatileToken.balanceOf(user2), VOLATILE_AMOUNT);
    }

    function testCanClaimView() public {
        // User hasn't claimed yet, should be able to claim
        (bool canClaim, uint256 timeUntil) = faucet.canClaim(user1);
        assertTrue(canClaim);
        assertEq(timeUntil, 0);

        // User claims
        vm.prank(user1);
        faucet.claimTokens();

        // User should still be able to claim (no cooldown)
        (canClaim, timeUntil) = faucet.canClaim(user1);
        assertTrue(canClaim);
        assertEq(timeUntil, 0);
    }

    function testGetFaucetBalance() public {
        (uint256 stableBalance, uint256 volatileBalance) = faucet
            .getFaucetBalance();

        assertEq(stableBalance, 10000000 * 10 ** 18);
        assertEq(volatileBalance, 5000000 * 10 ** 18);

        // Claim some tokens
        vm.prank(user1);
        faucet.claimTokens();

        // Check balance decreased
        (stableBalance, volatileBalance) = faucet.getFaucetBalance();
        assertEq(stableBalance, 10000000 * 10 ** 18 - STABLE_AMOUNT);
        assertEq(volatileBalance, 5000000 * 10 ** 18 - VOLATILE_AMOUNT);
    }

    function testSetDistributionAmounts() public {
        vm.startPrank(owner);

        uint256 newStableAmount = 20000 * 10 ** 18;
        uint256 newVolatileAmount = 100 * 10 ** 18;

        faucet.setDistributionAmounts(newStableAmount, newVolatileAmount);

        assertEq(faucet.stableAmount(), newStableAmount);
        assertEq(faucet.volatileAmount(), newVolatileAmount);

        vm.stopPrank();
    }

    function testSetCooldownPeriod() public {
        vm.startPrank(owner);

        uint256 newCooldown = 12 hours;
        faucet.setCooldownPeriod(newCooldown);

        assertEq(faucet.cooldownPeriod(), newCooldown);

        vm.stopPrank();
    }

    function testOnlyOwnerCanSetDistributionAmounts() public {
        vm.startPrank(user1);

        vm.expectRevert();
        faucet.setDistributionAmounts(1000 * 10 ** 18, 1 * 10 ** 18);

        vm.stopPrank();
    }

    function testOnlyOwnerCanSetCooldownPeriod() public {
        vm.startPrank(user1);

        vm.expectRevert();
        faucet.setCooldownPeriod(12 hours);

        vm.stopPrank();
    }

    function testEmergencyWithdraw() public {
        vm.startPrank(owner);

        uint256 withdrawAmount = 1000 * 10 ** 18;
        uint256 initialBalance = stableToken.balanceOf(owner);

        faucet.emergencyWithdraw(address(stableToken), withdrawAmount);

        assertEq(stableToken.balanceOf(owner), initialBalance + withdrawAmount);

        vm.stopPrank();
    }

    function testCannotClaimWithInsufficientFaucetBalance() public {
        // Deploy a new faucet with minimal funding
        vm.startPrank(owner);

        // Mint more tokens for this test
        stableToken.mint(owner, 200 * 10 ** 18);
        volatileToken.mint(owner, 2 * 10 ** 18);

        MockTokenFaucet smallFaucet = new MockTokenFaucet(
            address(stableToken),
            address(volatileToken)
        );

        // Fund with less than distribution amount
        stableToken.transfer(address(smallFaucet), 100 * 10 ** 18);
        volatileToken.transfer(address(smallFaucet), 1 * 10 ** 18);
        vm.stopPrank();

        // Try to claim
        vm.startPrank(user1);
        vm.expectRevert("Insufficient stable tokens in faucet");
        smallFaucet.claimTokens();
        vm.stopPrank();
    }

    function testFundFaucet() public {
        // Mint tokens for this test
        vm.startPrank(owner);
        stableToken.mint(owner, 100000 * 10 ** 18);
        volatileToken.mint(owner, 50 * 10 ** 18);

        // Give user1 some tokens
        stableToken.transfer(user1, 50000 * 10 ** 18);
        volatileToken.transfer(user1, 25 * 10 ** 18);
        vm.stopPrank();

        vm.startPrank(user1);

        // Approve faucet
        stableToken.approve(address(faucet), 50000 * 10 ** 18);
        volatileToken.approve(address(faucet), 25 * 10 ** 18);

        // Get initial balance
        (uint256 initialStable, uint256 initialVolatile) = faucet
            .getFaucetBalance();

        // Fund faucet
        faucet.fundFaucet(50000 * 10 ** 18, 25 * 10 ** 18);

        // Check new balance
        (uint256 newStable, uint256 newVolatile) = faucet.getFaucetBalance();
        assertEq(newStable, initialStable + 50000 * 10 ** 18);
        assertEq(newVolatile, initialVolatile + 25 * 10 ** 18);

        vm.stopPrank();
    }
}

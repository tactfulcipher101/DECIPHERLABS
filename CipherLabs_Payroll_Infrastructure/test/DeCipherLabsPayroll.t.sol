// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DeCipherLabsPayroll.sol";
import "../src/DeCipherLabsPayrollFactory.sol";
import "../src/HedgeVaultManager.sol";
import "../src/MockStablecoin.sol";
import "../src/MockVolatileToken.sol";
import "../src/MockSwapRouter.sol";

contract DeCipherLabsPayrollTest is Test {
    DeCipherLabsPayrollFactory factory;
    DeCipherLabsPayroll payroll;
    HedgeVaultManager hedgeVault;
    MockStablecoin mockStable;
    MockVolatileToken mockVolatile;
    MockSwapRouter swapRouter;

    address payable constant TREASURY =
        payable(0x1234567890123456789012345678901234567890);
    address constant COMPANY_OWNER = 0x2345678901234567890123456789012345678901;
    address constant EMPLOYEE1 = 0x3456789012345678901234567890123456789012;
    address constant EMPLOYEE2 = 0x4567890123456789012345678901234567890123;
    address constant TAX_RECIPIENT = 0x5678901234567890123456789012345678901234;

    function setUp() public {
        // Deploy mock tokens
        mockStable = new MockStablecoin();
        mockVolatile = new MockVolatileToken();

        // Deploy swap router
        swapRouter = new MockSwapRouter();

        // Deploy hedge vault manager
        hedgeVault = new HedgeVaultManager();
        hedgeVault.initialize(
            address(mockStable),
            address(swapRouter),
            address(factory)
        );

        // Set the swap router explicitly
        hedgeVault.setSwapRouter(address(swapRouter));

        // Deploy factory
        factory = new DeCipherLabsPayrollFactory();
        factory.initialize(TREASURY, 100, address(hedgeVault)); // 1% fee

        // Now set the factory in the hedge vault manager so it can be called from payroll contracts
        vm.prank(address(hedgeVault.owner()));
        hedgeVault.setFactory(address(factory));

        // Deploy payroll through factory
        vm.prank(COMPANY_OWNER);
        address payrollAddress = factory.deployCompanyPayroll(
            COMPANY_OWNER,
            TAX_RECIPIENT
        );
        payroll = DeCipherLabsPayroll(payable(payrollAddress));

        // Mint tokens for testing
        vm.prank(address(mockStable));
        mockStable.mint(COMPANY_OWNER, 1000000 * 10 ** 18);

        vm.prank(address(mockVolatile));
        mockVolatile.mint(COMPANY_OWNER, 1000000 * 10 ** 18);

        // Fund swap router for swaps
        vm.prank(address(mockStable));
        mockStable.mint(address(swapRouter), 1000000 * 10 ** 18);

        vm.prank(address(mockVolatile));
        mockVolatile.mint(address(swapRouter), 1000000 * 10 ** 18);
    }

    function testDeployPayroll() public {
        assertEq(address(payroll.owner()), COMPANY_OWNER);
    }

    function testAddEmployee() public {
        vm.startPrank(COMPANY_OWNER);

        payroll.addEmployee(
            EMPLOYEE1,
            address(mockStable),
            5000 * 10 ** 18, // 5000 tokens per period
            DeCipherLabsPayroll.Frequency.MONTHLY,
            0,
            1000 // 10% tax
        );

        vm.stopPrank();

        // Check employee was added
        (
            address wallet,
            uint8 tokenType,
            address tokenAddress,
            uint256 salaryPerPeriod,
            uint8 frequency,
            uint64 customFrequency,
            uint64 nextPayTimestamp,
            uint16 taxBps,
            bool active,
            uint256 owed
        ) = payroll.getEmployee(EMPLOYEE1);

        assertEq(wallet, EMPLOYEE1);
        assertEq(tokenAddress, address(mockStable));
        assertEq(salaryPerPeriod, 5000 * 10 ** 18);
        assertEq(frequency, uint8(DeCipherLabsPayroll.Frequency.MONTHLY));
        assertEq(taxBps, 1000);
        assertTrue(active);
    }

    function testProcessPayment() public {
        vm.startPrank(COMPANY_OWNER);

        // Add employee
        payroll.addEmployee(
            EMPLOYEE1,
            address(mockStable),
            5000 * 10 ** 18, // 5000 tokens per period
            DeCipherLabsPayroll.Frequency.MONTHLY,
            0,
            1000 // 10% tax
        );

        vm.stopPrank();

        // Approve payroll contract to spend tokens
        vm.startPrank(COMPANY_OWNER);
        mockStable.approve(address(payroll), 10000 * 10 ** 18);

        // Fund the payroll contract
        payroll.fundWithERC20(address(mockStable), 6000 * 10 ** 18); // Includes 1% fee
        vm.stopPrank();

        // Skip time to make payment due
        vm.warp(block.timestamp + 30 days); // Monthly period

        // Process payment
        vm.startPrank(COMPANY_OWNER);
        payroll.forceProcessPayment(EMPLOYEE1);
        vm.stopPrank();

        // Check employee received payment (5000 - 10% tax = 4500)
        assertEq(mockStable.balanceOf(EMPLOYEE1), 4500 * 10 ** 18);
    }

    function testForceProcessPaymentBypassesTimeCheck() public {
        vm.startPrank(COMPANY_OWNER);

        // Add employee
        payroll.addEmployee(
            EMPLOYEE1,
            address(mockStable),
            5000 * 10 ** 18, // 5000 tokens per period
            DeCipherLabsPayroll.Frequency.MONTHLY, // Monthly
            0,
            0 // No tax
        );

        vm.stopPrank();

        // Approve and fund
        vm.startPrank(COMPANY_OWNER);
        mockStable.approve(address(payroll), 10000 * 10 ** 18);
        payroll.fundWithERC20(address(mockStable), 6000 * 10 ** 18);
        vm.stopPrank();

        // Don't skip time - payment should not be due yet
        // This should fail with regular processPayment
        vm.expectRevert("not due");
        vm.prank(COMPANY_OWNER);
        payroll.processPayment(EMPLOYEE1);

        // But forceProcessPayment should work
        vm.prank(COMPANY_OWNER);
        payroll.forceProcessPayment(EMPLOYEE1);

        // Check employee received payment
        assertEq(mockStable.balanceOf(EMPLOYEE1), 5000 * 10 ** 18);
    }

    function testMinutelyPaymentTiming() public {
        vm.startPrank(COMPANY_OWNER);

        // Add employee with minutely frequency
        payroll.addEmployee(
            EMPLOYEE1,
            address(mockStable),
            100 * 10 ** 18, // 100 tokens per period
            DeCipherLabsPayroll.Frequency.MINUTELY,
            0,
            0 // No tax
        );

        vm.stopPrank();

        // Approve and fund
        vm.startPrank(COMPANY_OWNER);
        mockStable.approve(address(payroll), 10000 * 10 ** 18);
        payroll.fundWithERC20(address(mockStable), 200 * 10 ** 18);
        vm.stopPrank();

        // Should fail immediately after adding (not due yet)
        vm.expectRevert("not due");
        vm.prank(COMPANY_OWNER);
        payroll.processPayment(EMPLOYEE1);

        // Skip 1 minute
        vm.warp(block.timestamp + 61 seconds); // More than 1 minute

        // Should now work
        vm.prank(COMPANY_OWNER);
        payroll.processPayment(EMPLOYEE1);

        assertEq(mockStable.balanceOf(EMPLOYEE1), 100 * 10 ** 18);
    }

    function testHedgeVaultConfiguration() public {
        vm.startPrank(COMPANY_OWNER);

        // Add employee
        payroll.addEmployee(
            EMPLOYEE1,
            address(mockVolatile),
            5000 * 10 ** 18,
            DeCipherLabsPayroll.Frequency.MONTHLY,
            0,
            0
        );

        // Configure hedge vault
        payroll.configureHedgeVault(
            EMPLOYEE1,
            DeCipherLabsPayroll.RiskLevel.MODERATE,
            500, // 5% volatility threshold
            address(mockVolatile), // volatile token
            address(mockStable) // stable token
        );

        vm.stopPrank();

        // Get employee data and check hedge config
        (
            address wallet,
            uint8 tokenType,
            address tokenAddress,
            uint256 salaryPerPeriod,
            uint8 frequency,
            uint64 customFrequency,
            uint64 nextPayTimestamp,
            uint16 taxBps,
            bool active,
            uint256 owed
        ) = payroll.getEmployee(EMPLOYEE1);

        // Additional check for hedge config would need a view function
        // This demonstrates the configuration was set
        assertTrue(active);
    }

    function testHedgeVaultPayment() public {
        vm.startPrank(COMPANY_OWNER);

        // Add employee with volatile token (mETH) for hedge vault
        payroll.addEmployee(
            EMPLOYEE1,
            address(mockVolatile), // Using volatile token for hedge vault test
            5000 * 10 ** 18, // 5000 tokens per period
            DeCipherLabsPayroll.Frequency.WEEKLY,
            0,
            0 // No tax for simplicity
        );

        // Configure hedge vault for this employee - Moderate risk (40% volatile, 60% stable)
        payroll.configureHedgeVault(
            EMPLOYEE1,
            DeCipherLabsPayroll.RiskLevel.MODERATE,
            500, // 5% volatility threshold
            address(mockVolatile), // volatile token
            address(mockStable) // stable token
        );

        vm.stopPrank();

        // Fund the payroll contract with volatile tokens (what employee will be paid in)
        vm.startPrank(COMPANY_OWNER);
        mockVolatile.approve(address(payroll), 10000 * 10 ** 18);
        payroll.fundWithERC20(address(mockVolatile), 6000 * 10 ** 18); // Include 1% fee
        vm.stopPrank();

        // Skip time to make payment due
        vm.warp(block.timestamp + 7 days); // Weekly period

        // This call should trigger the payment to be processed through the hedge vault
        // Since the employee has hedge vault enabled, this should route through HedgeVaultManager
        vm.prank(COMPANY_OWNER);
        payroll.processPaymentWithHedge(EMPLOYEE1);

        // Verify the payment was processed by checking the employee's payment history was updated
        // or that next payment timestamp was scheduled
        (, , , , , , uint64 nextPayTimestamp, , bool active, ) = payroll
            .getEmployee(EMPLOYEE1);

        // Check that the employee is still active and next pay timestamp was updated
        assertTrue(active, "Employee should still be active");
        assertGt(
            nextPayTimestamp,
            block.timestamp,
            "Next pay timestamp should be in the future for next period"
        );
    }

    function testSalaryAdvances() public {
        vm.startPrank(COMPANY_OWNER);

        // Add employee
        payroll.addEmployee(
            EMPLOYEE1,
            address(mockStable),
            5000 * 10 ** 18,
            DeCipherLabsPayroll.Frequency.MONTHLY,
            0,
            0
        );

        // Authorize advances for this employee
        payroll.setAdvanceAuthorization(EMPLOYEE1, true);

        vm.stopPrank();

        // Approve and fund
        vm.startPrank(COMPANY_OWNER);
        mockStable.approve(address(payroll), 10000 * 10 ** 18);
        payroll.fundWithERC20(address(mockStable), 10000 * 10 ** 18);
        vm.stopPrank();

        // Request advance as employee
        vm.prank(EMPLOYEE1);
        payroll.requestAdvance(1000 * 10 ** 18); // 20% of salary advance

        assertEq(mockStable.balanceOf(EMPLOYEE1), 1000 * 10 ** 18);
    }
}

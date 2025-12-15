// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DeCipherLabsPayroll.sol";
import "../src/DeCipherLabsPayrollFactory.sol";
import "../src/HedgeVaultManager.sol";
import "../src/MockStablecoin.sol";
import "../src/MockVolatileToken.sol";

contract IntegrationTest is Test {
    DeCipherLabsPayrollFactory factory;
    DeCipherLabsPayroll payroll;
    HedgeVaultManager hedgeVault;
    MockStablecoin mockStable;
    MockVolatileToken mockVolatile;

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

        // Deploy hedge vault manager
        hedgeVault = new HedgeVaultManager();
        hedgeVault.initialize(
            address(mockStable),
            address(0x789),
            address(factory)
        );

        // Deploy factory
        factory = new DeCipherLabsPayrollFactory();
        factory.initialize(TREASURY, 100, address(hedgeVault)); // 1% fee

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
    }

    function testForcePaymentBypassesTiming() public {
        vm.startPrank(COMPANY_OWNER);

        // Add employee with minutely frequency
        payroll.addEmployee(
            EMPLOYEE1,
            address(mockStable),
            100 * 10 ** 18,
            DeCipherLabsPayroll.Frequency.MINUTELY,
            0,
            0
        );

        vm.stopPrank();

        // Approve and fund
        vm.startPrank(COMPANY_OWNER);
        mockStable.approve(address(payroll), 1000 * 10 ** 18);
        payroll.fundWithERC20(address(mockStable), 200 * 10 ** 18);
        vm.stopPrank();

        // Should fail with regular processPayment (not due yet)
        vm.expectRevert("not due");
        vm.prank(COMPANY_OWNER);
        payroll.processPayment(EMPLOYEE1);

        // But forceProcessPayment should work
        vm.prank(COMPANY_OWNER);
        payroll.forceProcessPayment(EMPLOYEE1);

        // Check that employee got paid
        assertEq(mockStable.balanceOf(EMPLOYEE1), 100 * 10 ** 18);
    }

    function testMultiplePaymentFrequencies() public {
        vm.startPrank(COMPANY_OWNER);

        // Add employees with different frequencies
        payroll.addEmployee(
            EMPLOYEE1,
            address(mockStable),
            1000 * 10 ** 18,
            DeCipherLabsPayroll.Frequency.HOURLY,
            0,
            0
        );

        payroll.addEmployee(
            EMPLOYEE2,
            address(mockStable),
            2000 * 10 ** 18,
            DeCipherLabsPayroll.Frequency.WEEKLY,
            0,
            0
        );

        vm.stopPrank();

        // Approve and fund
        vm.startPrank(COMPANY_OWNER);
        mockStable.approve(address(payroll), 10000 * 10 ** 18);
        payroll.fundWithERC20(address(mockStable), 5000 * 10 ** 18);
        vm.stopPrank();

        // Skip 1 hour - EMPLOYEE1 should be due, EMPLOYEE2 should not
        vm.warp(block.timestamp + 1 hours);

        vm.prank(COMPANY_OWNER);
        payroll.forceProcessPayment(EMPLOYEE1); // Should work

        vm.expectRevert("not due");
        vm.prank(COMPANY_OWNER);
        payroll.processPayment(EMPLOYEE2); // Should fail

        // Skip to week - now EMPLOYEE2 should be due too
        vm.warp(block.timestamp + 7 days - 1 hours); // Total: 1 week

        vm.prank(COMPANY_OWNER);
        payroll.forceProcessPayment(EMPLOYEE2); // Should work with force

        assertEq(mockStable.balanceOf(EMPLOYEE1), 1000 * 10 ** 18);
        assertEq(mockStable.balanceOf(EMPLOYEE2), 2000 * 10 ** 18);
    }
}

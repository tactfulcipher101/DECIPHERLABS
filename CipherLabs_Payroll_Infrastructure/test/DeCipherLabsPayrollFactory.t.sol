// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DeCipherLabsPayrollFactory.sol";
import "../src/HedgeVaultManager.sol";
import "../src/MockStablecoin.sol";

contract DeCipherLabsPayrollFactoryTest is Test {
    DeCipherLabsPayrollFactory factory;
    HedgeVaultManager hedgeVault;
    MockStablecoin mockStable;

    address payable constant TREASURY =
        payable(0x1234567890123456789012345678901234567890);
    address constant COMPANY_OWNER = 0x2345678901234567890123456789012345678901;
    address constant TAX_RECIPIENT = 0x5678901234567890123456789012345678901234;

    function setUp() public {
        // Deploy dependencies
        mockStable = new MockStablecoin();
        hedgeVault = new HedgeVaultManager();
        hedgeVault.initialize(
            address(mockStable),
            address(0x789),
            address(factory)
        );

        // Deploy factory
        factory = new DeCipherLabsPayrollFactory();
        factory.initialize(TREASURY, 100, address(hedgeVault)); // 1% fee
    }

    function testDeployFactory() public {
        assertEq(factory.decipherlabsTreasury(), TREASURY);
        assertEq(factory.decipherlabsFeeBps(), 100); // 1%
        assertEq(factory.hedgeVaultManager(), address(hedgeVault));
    }

    function testDeployCompanyPayroll() public {
        vm.startPrank(COMPANY_OWNER);
        address payrollAddress = factory.deployCompanyPayroll(
            COMPANY_OWNER,
            TAX_RECIPIENT
        );
        vm.stopPrank();

        assertTrue(factory.isPayroll(payrollAddress));
        assertNotEq(payrollAddress, address(0));
    }

    function testSetTreasury() public {
        vm.startPrank(address(factory.owner()));
        address newTreasury = payable(
            0x1111111111111111111111111111111111111111
        );
        factory.setTreasury(newTreasury);
        vm.stopPrank();

        assertEq(factory.decipherlabsTreasury(), newTreasury);
    }

    function testSetFeeBps() public {
        vm.startPrank(address(factory.owner()));
        uint16 newFee = 200; // 2%
        factory.setFeeBps(newFee);
        vm.stopPrank();

        assertEq(factory.decipherlabsFeeBps(), newFee);
    }

    function testSetHedgeVaultManager() public {
        HedgeVaultManager newHedgeVault = new HedgeVaultManager();
        newHedgeVault.initialize(
            address(mockStable),
            address(0x789),
            address(0)
        );

        vm.startPrank(address(factory.owner()));
        factory.setHedgeVaultManager(address(newHedgeVault));
        vm.stopPrank();

        assertEq(factory.hedgeVaultManager(), address(newHedgeVault));
    }

    function testDeployMultiplePayrolls() public {
        vm.startPrank(COMPANY_OWNER);
        address payroll1 = factory.deployCompanyPayroll(
            COMPANY_OWNER,
            TAX_RECIPIENT
        );
        address payroll2 = factory.deployCompanyPayroll(
            0x3333333333333333333333333333333333333333,
            address(0x444)
        );
        vm.stopPrank();

        assertTrue(factory.isPayroll(payroll1));
        assertTrue(factory.isPayroll(payroll2));
        assertNotEq(payroll1, payroll2);
    }

    function testInitializeValidation() public {
        DeCipherLabsPayrollFactory newFactory = new DeCipherLabsPayrollFactory();

        // Test zero treasury
        vm.expectRevert("treasury-zero");
        newFactory.initialize(address(0), 100, address(hedgeVault));

        // Test high fee
        vm.expectRevert("fee-too-high");
        newFactory.initialize(TREASURY, 1001, address(hedgeVault)); // > 10%

        // Test zero hedge vault
        vm.expectRevert("hedgeVault-zero");
        newFactory.initialize(TREASURY, 100, address(0));
    }

    function testDeployCompanyPayrollValidation() public {
        vm.startPrank(COMPANY_OWNER);

        // Test zero owner
        vm.expectRevert("owner-zero");
        factory.deployCompanyPayroll(address(0), TAX_RECIPIENT);

        vm.stopPrank();
    }
}

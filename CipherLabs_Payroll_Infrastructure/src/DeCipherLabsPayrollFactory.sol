// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DeCipherLabsPayroll.sol";
import "./HedgeVaultManager.sol";

contract DeCipherLabsPayrollFactory is Ownable {
    // Basic configuration
    address public decipherlabsTreasury;
    uint16 public decipherlabsFeeBps;
    address public hedgeVaultManager;

    // Minimal tracking
    mapping(address => bool) public isPayroll;
    mapping(address => address[]) public companyPayrolls;

    constructor() Ownable(msg.sender) {
        // For testnet: Owner set in constructor
    }

    function initialize(
        address _treasury,
        uint16 _feeBps,
        address _hedgeVaultManager
    ) external {
        require(_treasury != address(0), "treasury-zero");
        require(_feeBps <= 1000, "fee-too-high"); // MAX_FEE_BPS = 1000 inlined
        require(_hedgeVaultManager != address(0), "hedgeVault-zero");

        decipherlabsTreasury = _treasury;
        decipherlabsFeeBps = _feeBps;
        hedgeVaultManager = _hedgeVaultManager;
    }

    function deployCompanyPayroll(
        address companyOwner,
        address taxRecipient
    ) external returns (address payrollAddr) {
        require(companyOwner != address(0), "owner-zero");

        // Deploy new payroll contract
        DeCipherLabsPayroll payroll = new DeCipherLabsPayroll();
        payrollAddr = address(payroll);

        // Initialize with error handling
        try payroll.initialize(companyOwner, taxRecipient, address(this)) {
            // Success
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("init-failed: ", reason)));
        } catch {
            revert("init-failed-unknown");
        }
        isPayroll[payrollAddr] = true;
        companyPayrolls[companyOwner].push(payrollAddr);
    }

    function getCompanyPayrolls(
        address owner
    ) external view returns (address[] memory) {
        return companyPayrolls[owner];
    }

    // Admin functions to update treasury and fee
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "treasury-zero");
        decipherlabsTreasury = _treasury;
    }

    function setFeeBps(uint16 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "fee-too-high"); // Max 10%
        decipherlabsFeeBps = _feeBps;
    }

    function setHedgeVaultManager(
        address _hedgeVaultManager
    ) external onlyOwner {
        require(_hedgeVaultManager != address(0), "hedgeVault-zero");
        hedgeVaultManager = _hedgeVaultManager;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IDeCipherLabs_PayrollFactory {
    function decipherlabsTreasury() external view returns (address);
    function decipherlabsFeeBps() external view returns (uint16);
    function hedgeVaultManager() external view returns (address);
    function isPayroll(address) external view returns (bool);
}

# DeCipherLabs Payroll - API Documentation

## Overview

This document provides technical reference for developers integrating with or building on top of the DeCipherLabs Payroll protocol.

**Base Sepolia Deployment**:
- Factory: `0xd0798b082b29E00D4Ecb0682E896D72181fa7873`
- HedgeVaultManager: `0x535D567552cBe22dc97a9C231fFa9B2Ba36903C3`

---

## Table of Contents

1. [Smart Contract Interfaces](#smart-contract-interfaces)
2. [Frontend Utilities](#frontend-utilities)
3. [Integration Examples](#integration-examples)
4. [Events](#events)
5. [Error Codes](#error-codes)

---

## Smart Contract Interfaces

### PayrollFactory

#### createPayroll
```solidity
function createPayroll(
    address owner,
    address taxRecipient
) external returns (address payroll)
```

Creates a new payroll contract instance.

**Parameters**:
- `owner`: Address that will own the payroll contract
- `taxRecipient`: Address to receive tax withholdings

**Returns**: Address of the newly created payroll contract

**Events**: `PayrollCreated(address indexed owner, address indexed payroll)`

**Example**:
```javascript
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
const tx = await factory.createPayroll(ownerAddress, taxRecipientAddress);
const receipt = await tx.wait();
```

---

### DeCipherLabsPayroll

#### addEmployee
```solidity
function addEmployee(
    address employeeAddress,
    uint256 salary,
    Frequency frequency,
    address tokenAddress,
    uint256 taxBps
) external onlyOwner
```

Adds a new employee to the payroll.

**Parameters**:
- `employeeAddress`: Employee's wallet address
- `salary`: Salary amount (in token's smallest unit)
- `frequency`: Payment frequency (0=Weekly, 1=Bi-weekly, 2=Monthly)
- `tokenAddress`: ERC-20 token address for payments
- `taxBps`: Tax withholding in basis points (1000 = 10%)

**Events**: `EmployeeAdded(address indexed employee, uint256 salary)`

**Example**:
```javascript
const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
const salary = ethers.utils.parseUnits("1000", 18); // 1000 tokens
await payroll.addEmployee(
    employeeAddress,
    salary,
    0, // Weekly
    USDC_ADDRESS,
    1000 // 10% tax
);
```

#### processPayment
```solidity
function processPayment(address employee) external onlyOwner
```

Processes payment for an employee.

**Parameters**:
- `employee`: Employee's wallet address

**Requirements**:
- Employee must be active
- Payment must be due
- Contract must have sufficient balance
- If hedge vault enabled, use `processPaymentWithHedge` instead

**Events**: `PaymentProcessed(address indexed employee, uint256 amount)`

#### configureHedgeVault
```solidity
function configureHedgeVault(
    address employee,
    RiskLevel riskLevel,
    uint256 volatilityThreshold,
    address volatileToken,
    address stableToken
) external onlyOwner
```

Configures hedge vault for an employee.

**Parameters**:
- `employee`: Employee's wallet address
- `riskLevel`: 0=Conservative, 1=Moderate, 2=Aggressive
- `volatilityThreshold`: Rebalancing threshold in basis points
- `volatileToken`: Address of volatile token (e.g., mETH)
- `stableToken`: Address of stable token (e.g., mUSDC)

**Events**: `HedgeVaultConfigured(address indexed employee, uint8 riskLevel)`

**Example**:
```javascript
await payroll.configureHedgeVault(
    employeeAddress,
    1, // Moderate
    500, // 5% threshold
    METH_ADDRESS,
    USDC_ADDRESS
);
```

#### fundWithERC20
```solidity
function fundWithERC20(address token, uint256 amount) external
```

Funds the payroll contract with ERC-20 tokens.

**Parameters**:
- `token`: ERC-20 token address
- `amount`: Amount to fund (including 1% fee)

**Requirements**:
- Caller must have approved token spending
- Amount must include 1% service fee

**Events**: `ContractFunded(address indexed token, uint256 amount)`

---

### HedgeVaultManager

#### processPayment
```solidity
function processPayment(
    address employee,
    uint256 amount,
    address stableToken,
    address volatileToken
) external returns (uint256 stableAmount, uint256 volatileAmount)
```

Processes payment with hedge vault splitting and swapping.

**Parameters**:
- `employee`: Employee's wallet address
- `amount`: Total payment amount
- `stableToken`: Stable token address
- `volatileToken`: Volatile token address

**Returns**:
- `stableAmount`: Amount sent in stable token
- `volatileAmount`: Amount sent in volatile token (after swap)

**Events**: `PaymentProcessed`, `TokenSwapped`

---

## Frontend Utilities

### payrollContract.js

#### deployCompanyPayroll
```javascript
async function deployCompanyPayroll(
    companyName,
    taxRecipient,
    signer
)
```

Deploys a new payroll contract.

**Parameters**:
- `companyName`: Company name (stored in localStorage)
- `taxRecipient`: Tax recipient address
- `signer`: Ethers signer instance

**Returns**: Deployed contract address

**Example**:
```javascript
import { deployCompanyPayroll } from './utils/payrollContract';

const address = await deployCompanyPayroll(
    "My Company",
    "0x...",
    signer
);
```

#### addEmployee
```javascript
async function addEmployee(
    payrollAddress,
    employeeData,
    signer
)
```

Adds an employee to the payroll.

**Parameters**:
- `payrollAddress`: Payroll contract address
- `employeeData`: Object containing employee details
- `signer`: Ethers signer instance

**Employee Data Structure**:
```javascript
{
    walletAddress: "0x...",
    salary: "1000",
    frequency: 0, // 0=Weekly, 1=Bi-weekly, 2=Monthly
    tokenAddress: "0x...",
    taxBps: 1000 // 10%
}
```

#### processPayment
```javascript
async function processPayment(
    payrollAddress,
    employeeAddress,
    signer
)
```

Processes payment for an employee.

---

### hedgeVault.js

#### configureEmployeeHedgeVault
```javascript
async function configureEmployeeHedgeVault(
    payrollContractAddress,
    employeeAddress,
    riskLevel,
    volatilityThreshold,
    signer
)
```

Configures hedge vault for an employee.

**Parameters**:
- `payrollContractAddress`: Payroll contract address
- `employeeAddress`: Employee wallet address
- `riskLevel`: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE"
- `volatilityThreshold`: Number (e.g., 500 for 5%)
- `signer`: Ethers signer instance

**Example**:
```javascript
import { configureEmployeeHedgeVault } from './utils/hedgeVault';

await configureEmployeeHedgeVault(
    payrollAddress,
    employeeAddress,
    "MODERATE",
    500,
    signer
);
```

---

## Integration Examples

### Complete Payroll Setup

```javascript
import { ethers } from 'ethers';
import { deployCompanyPayroll, addEmployee } from './utils/payrollContract';
import { configureEmployeeHedgeVault } from './utils/hedgeVault';

async function setupPayroll() {
    // 1. Connect wallet
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // 2. Deploy payroll contract
    const payrollAddress = await deployCompanyPayroll(
        "Acme Corp",
        "0x...", // tax recipient
        signer
    );
    
    // 3. Add employee
    await addEmployee(payrollAddress, {
        walletAddress: "0x...",
        salary: "1000",
        frequency: 2, // Monthly
        tokenAddress: USDC_ADDRESS,
        taxBps: 1000 // 10%
    }, signer);
    
    // 4. Configure hedge vault
    await configureEmployeeHedgeVault(
        payrollAddress,
        "0x...", // employee address
        "MODERATE",
        500,
        signer
    );
    
    // 5. Fund contract
    const token = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
    const amount = ethers.utils.parseUnits("10100", 18); // 10000 + 1% fee
    
    await token.approve(payrollAddress, amount);
    await payroll.fundWithERC20(USDC_ADDRESS, amount);
}
```

### Batch Employee Addition

```javascript
async function addEmployeesBatch(payrollAddress, employees, signer) {
    for (const emp of employees) {
        await addEmployee(payrollAddress, emp, signer);
        // Wait for confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Usage
const employees = [
    { walletAddress: "0x...", salary: "1000", frequency: 0, tokenAddress: USDC_ADDRESS, taxBps: 1000 },
    { walletAddress: "0x...", salary: "1500", frequency: 1, tokenAddress: USDC_ADDRESS, taxBps: 1000 },
];

await addEmployeesBatch(payrollAddress, employees, signer);
```

---

## Events

### PayrollFactory Events

```solidity
event PayrollCreated(address indexed owner, address indexed payroll);
event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
event FeeUpdated(uint256 oldFee, uint256 newFee);
```

### DeCipherLabsPayroll Events

```solidity
event EmployeeAdded(address indexed employee, uint256 salary, uint256 frequency);
event EmployeeRemoved(address indexed employee);
event EmployeeReactivated(address indexed employee);
event PaymentProcessed(address indexed employee, uint256 amount, uint256 timestamp);
event ContractFunded(address indexed token, uint256 amount);
event TaxWithheld(address indexed employee, uint256 amount);
event HedgeVaultConfigured(address indexed employee, uint8 riskLevel);
```

### HedgeVaultManager Events

```solidity
event HedgeVaultInitialized(address indexed employee, uint8 riskLevel);
event PaymentProcessed(address indexed employee, uint256 stableAmount, uint256 volatileAmount);
event TokenSwapped(address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut);
```

---

## Error Codes

### Common Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `Ownable: caller is not the owner` | Only owner can call this function | Use owner wallet |
| `Insufficient balance` | Contract doesn't have enough tokens | Fund the contract |
| `Employee not found` | Employee address not in system | Add employee first |
| `Payment not due` | Too early to process payment | Wait until next payment date |
| `Hedge vault not configured` | Hedge vault not set up | Configure hedge vault first |
| `Invalid risk level` | Risk level out of range | Use 0, 1, or 2 |

### Handling Errors

```javascript
try {
    await payroll.processPayment(employeeAddress);
} catch (error) {
    if (error.message.includes("Payment not due")) {
        console.log("Payment is not due yet");
    } else if (error.message.includes("Insufficient balance")) {
        console.log("Please fund the contract");
    } else {
        console.error("Unexpected error:", error);
    }
}
```

---

## Rate Limits & Best Practices

### Gas Optimization

- Batch employee additions when possible
- Use `multicall` for reading multiple employee data
- Approve tokens once with max amount for frequent funding

### Transaction Management

- Wait for confirmation before next transaction
- Use appropriate gas limits
- Monitor transaction status on explorer

### Security

- Validate all addresses before transactions
- Use hardware wallets for production
- Never expose private keys
- Implement multi-sig for large organizations

---

## Testing

### Testnet Information

**Network**: Base Sepolia
**Chain ID**: 84532
**RPC**: https://sepolia.base.org
**Explorer**: https://sepolia.basescan.org

### Test Tokens

Request test tokens from the development team or mint from contracts:
- mUSDC: `0x86a32F7925543bcdB4c13607E8241273A05463f9`
- mETH: `0xcAdaDeDbF3C1c385D1003a52eA4fCd26Cc6b081B`

---

## Support

**Technical Issues**: decipherlabshq@gmail.com
**Documentation**: [GitHub](https://github.com/decipherlabs)
**Community**: [@DeCipherLabs_HQ](https://twitter.com/DeCipherLabs_HQ)

---

**Version**: 1.0
**Last Updated**: December 4, 2024

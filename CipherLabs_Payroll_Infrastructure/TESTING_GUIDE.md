# DeCipherLabs Payroll Testing Guide

This document explains how to test the DeCipherLabs payroll system using mock tokens and the hedge vault functionality.

## 🏗️ 1. Contract Deployment and Setup

After deploying using the scripts, you'll have:

1. **Factory Contract**: `DeCipherLabs_PayrollFactory`
2. **Hedge Vault Manager**: `HedgeVaultManager`
3. **Mock Stablecoin**: `MockStablecoin` (for stable asset testing)
4. **Mock Volatile Token**: `MockVolatileToken` (for volatile asset testing)

## 🧪 2. Testing Process: Step-by-Step

### Step 1: Get Mock Tokens
The deployment scripts create two mock tokens:
- `MockStablecoin`: Mints 1 million stable tokens to the deployer
- `MockVolatileToken`: Mints 1 million volatile tokens to the deployer

To distribute these for testing:

```solidity
// Get both mock tokens
MockStablecoin mockStable = MockStablecoin(ADDRESS_OF_MOCK_STABLE_TOKEN);
MockVolatileToken mockVolatile = MockVolatileToken(ADDRESS_OF_MOCK_VOLATILE_TOKEN);

// Transfer tokens to test users
mockStable.transfer(0xTestUserAddress, 10000 * 10**18); // 10,000 stable tokens with 18 decimals
mockVolatile.transfer(0xTestUserAddress, 10 * 10**18);   // 10 volatile tokens with 18 decimals
```

Alternatively, if you need more tokens or want to mint additional tokens, you can extend the mock contract:

```solidity
// Add this function to the MockStablecoin contract for testing purposes
function mint(address to, uint256 amount) external {
    require(msg.sender == owner()); // Only owner can mint more
    _mint(to, amount);
}
```

### Step 2: Deploy a Company Payroll
The company owner uses the factory to deploy their payroll:

```solidity
// Company owner calls the factory to deploy their own payroll contract
address payrollAddress = factory.deployCompanyPayroll(
    companyOwnerAddress, // Company's admin/multisig
    taxRecipientAddress  // Set to address(0) to disable tax
);
```

### Step 3: Add Employees
Once the payroll is deployed, the company admin can add employees:

```solidity
// Interact with the specific payroll contract deployed for the company
DeCipherLabsPayroll payroll = DeCipherLabsPayroll(payrollAddress);

// Add an employee (admin function)
payroll.addEmployee(
    employeeWallet,    // Employee's wallet address
    address(mockToken), // Mock token address for testing
    5000 * 10**18,     // Salary (5,000 tokens per period)
    Frequency.WEEKLY,  // Payment frequency
    0,                 // Custom frequency not used with weekly
    100                // 1% tax (100 basis points)
);
```

### Step 4: Configure Hedge Vault (Phase 1 MVP Feature)
Employees can enable and configure the hedge vault for risk management:

```solidity
// Employee configures their hedge vault preferences
payroll.configureHedgeVault(
    RiskLevel.MODERATE, // 40% volatile / 60% stable allocation
    500                 // 5% volatility threshold for rebalancing
);

// Or enable the hedge vault without changing preferences
payroll.toggleHedgeVault(msg.sender, true); // Enable for the caller
```

Risk Levels Available:
- `RiskLevel.CONSERVATIVE`: 20% volatile / 80% stable
- `RiskLevel.MODERATE`: 40% volatile / 60% stable  
- `RiskLevel.AGGRESSIVE`: 60% volatile / 40% stable

### Step 5: Test Salary Distribution with Hedge Vault
When payroll processes payments, they get automatically routed through the hedge vault if enabled:

```solidity
// Admin processes a payment (this would typically be triggered by a scheduler)
payroll.processPaymentWithHedge(employeeAddress);

// The payment goes through the hedge vault, automatically allocating between 
// volatile and stable portions based on the employee's risk preference
```

## 🔄 6. Testing Hedge Vault Rebalancing

The hedge vault splits salary payments between the stable and volatile tokens based on the employee's risk preference. For testing:

1. **Configure Risk Allocation**: Based on risk level, payments are split:
   - **Conservative**: 20% to volatile token (mETH), 80% to stable token (mUSDC)
   - **Moderate**: 40% to volatile token (mETH), 60% to stable token (mUSDC)
   - **Aggressive**: 60% to volatile token (mETH), 40% to stable token (mUSDC)

2. **Test the Split Payments**:
   ```solidity
   // When employee receives 1000 mUSDC salary with moderate risk profile:
   // → 400 mUSDC goes to stable portion
   // → 600 mUSDC worth of mETH goes to volatile portion

   // This demonstrates the risk management feature in action
   ```

3. **Rebalancing Testing**: The system maintains the target allocation over time:
   - If mETH appreciates significantly, more of the portfolio becomes volatile
   - If mETH depreciates significantly, more becomes stable
   - When deviation exceeds threshold (e.g., 5%), automatic rebalancing occurs

4. **Manual Rebalancing**: The system also supports manual rebalancing to test the functionality:

```solidity
// Employee can manually rebalance if needed
HedgeVaultManager hedgeVault = HedgeVaultManager(hedgeVaultManagerAddress);
hedgeVault.rebalanceVault(employeeAddress);
```

3. **Trigger Conditions**: Test when:
   - Portfolio allocation strays beyond the set threshold (e.g., 5%)
   - Minimum time between rebalances has passed (currently 1 hour in MVP)

## 💸 7. Testing Advanced Features

### Testing Salary Advances (Phase 1 MVP)
Employees can request advances against future salary:

```solidity
// Employee requests an advance (up to 50% of salary)
payroll.requestAdvance(1000 * 10**18); // Request 1,000 tokens
```

### Testing Payment Processing
Monitor payment histories and balances:

```solidity
// Check employee payment history
PaymentRecord[] memory history = payroll.getPaymentHistory(employeeAddress);

// Monitor hedge vault balances
(uint256 stableBalance, uint256 volatileBalance) = hedgeVault.getVaultBalance(employeeAddress);
```

## 🧪 8. Complete Test Flow Example

```solidity
// 1. Deploy contracts using the deployment script
// 2. Get mock tokens distributed to test addresses
// 3. Company owner deploys payroll via factory
// 4. Company admin adds employees to payroll 
// 5. Employees configure their hedge vault preferences
// 6. Admin processes payments and observes automatic allocation
// 7. Test rebalancing when simulated market conditions change
// 8. Verify advance system works as expected
```

## 📝 9. Important Notes

- **For Mainnet**: Replace mock stablecoins with real USDC, DAI, etc.
- **Price Feeds**: The hedge vault will need real price feeds from Chainlink or similar for production
- **Gas Optimization**: Test with realistic transaction volumes to understand gas costs
- **Emergency Controls**: Use the pause functionality in case of unexpected behavior during testing

This testing infrastructure allows you to validate all Phase 1 features including the revolutionary Volatility Hedge Vaults before going to mainnet.
# DeCipherLabs Payroll - Testing Guide

## Overview
This guide provides step-by-step instructions for testing all features of the DeCipherLabs Payroll system on Base Sepolia testnet.

## Prerequisites

### 1. Wallet Setup
- Install MetaMask or compatible Web3 wallet
- Add Base Sepolia network to your wallet
- Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

### 2. Test Tokens
You'll need test tokens (mUSDC and mETH). Contact the development team or mint from deployed contracts:
- mUSDC: `0x86a32F7925543bcdB4c13607E8241273A05463f9`
- mETH: `0xcAdaDeDbF3C1c385D1003a52eA4fCd26Cc6b081B`

## Feature Testing

### 1. Company Setup

**Test Case: Deploy New Payroll Contract**
1. Navigate to the application
2. Connect your wallet
3. Enter company name (e.g., "Test Company")
4. Click "Deploy Company Contract"
5. Confirm transaction in MetaMask
6. Wait for deployment confirmation

**Expected Result:**
- Success message appears
- Contract address is displayed
- Dashboard view loads

**Verification:**
- Check Base Sepolia explorer for contract deployment
- Verify contract is initialized with correct owner

---

### 2. Employee Management

**Test Case 2.1: Add Single Employee**
1. Go to "Employees" tab
2. Fill in employee details:
   - Name: "John Doe"
   - Wallet Address: `0x...` (use a test address)
   - Salary: 1000
   - Payment Token: mUSDC
   - Frequency: Weekly
3. Click "Add Employee"
4. Confirm transaction

**Expected Result:**
- Employee appears in employee list
- Name and address are correctly displayed
- Payment details are accurate

**Test Case 2.2: Batch Employee Upload**
1. Create CSV file with format:
   ```
   name,address,salary,token,frequency
   Alice,0x123...,1500,mUSDC,weekly
   Bob,0x456...,2000,mUSDC,biweekly
   ```
2. Go to "Employees" tab
3. Click "Upload CSV"
4. Select your CSV file
5. Review preview
6. Click "Upload All"

**Expected Result:**
- All employees are added successfully
- Each employee shows correct details
- Transaction completes without errors

**Test Case 2.3: Remove Employee**
1. Select an employee from the list
2. Click "Remove Employee"
3. Confirm transaction

**Expected Result:**
- Employee is marked as inactive
- Employee no longer appears in active list
- Can be reactivated later

---

### 3. Contract Funding

**Test Case 3.1: Fund with mUSDC**
1. Go to "Funding" tab
2. Select token: mUSDC
3. Enter amount: 10000
4. Review fee breakdown (1% service fee)
5. Click "Fund Contract"
6. Approve token spending (if first time)
7. Confirm funding transaction

**Expected Result:**
- Balance updates in dashboard
- mUSDC balance shows correct amount
- 1% fee is deducted to treasury

**Verification:**
- Check contract balance on explorer
- Verify treasury received 1% fee

**Test Case 3.2: Fund with mETH**
1. Repeat above steps with mETH token
2. Verify mETH balance updates

---

### 4. Hedge Vault Configuration

**Test Case 4.1: Configure Employee Hedge Vault**
1. Go to "Settings" tab
2. Scroll to "Hedge Vault Configuration"
3. Select employee from dropdown
4. Choose risk level:
   - CONSERVATIVE (20% volatile, 80% stable)
   - MODERATE (40% volatile, 60% stable)
   - AGGRESSIVE (60% volatile, 40% stable)
5. Set volatility threshold: 500 (5%)
6. Click "Configure Hedge Vault"
7. Confirm transaction

**Expected Result:**
- Success message appears
- Employee's hedge vault is initialized
- Configuration is saved on-chain

**Verification:**
- Check transaction on explorer
- Verify `HedgeVaultConfigured` event is emitted

---

### 5. Payment Processing

**Test Case 5.1: Process Regular Payment**
1. Go to "Payments" tab
2. Find employee without hedge vault
3. Click "Pay Now"
4. Confirm transaction

**Expected Result:**
- Payment is processed successfully
- Employee receives full salary in specified token
- Next payment date is updated

**Verification:**
- Check employee wallet balance
- Verify payment event on explorer
- Confirm next payment timestamp

**Test Case 5.2: Process Payment with Hedge Vault**
1. Find employee with configured hedge vault
2. Click "Pay Now"
3. Confirm transaction

**Expected Result:**
- Payment is split according to risk level
- Stable portion sent directly in mUSDC
- Volatile portion swapped to mETH
- Employee receives both tokens

**Verification on BaseScan:**
1. Open transaction details
2. Check "ERC-20 Tokens Transferred" section
3. Verify transfers:
   - Payroll → HedgeVaultManager (full amount)
   - HedgeVaultManager → Employee (stable portion in mUSDC)
   - HedgeVaultManager → SwapRouter (volatile portion in mUSDC)
   - SwapRouter → Employee (volatile portion in mETH)

**Example for 200 mUSDC salary with MODERATE risk:**
- 120 mUSDC sent directly to employee
- 80 mUSDC swapped to 80 mETH
- Employee receives: 120 mUSDC + 80 mETH

---

### 6. Tax Withholding

**Test Case 6.1: Enable Tax Withholding**
1. Go to "Settings" tab
2. Find "Tax Settings"
3. Enable tax withholding
4. Set tax recipient address
5. Set tax percentage (e.g., 10%)
6. Click "Update Tax Settings"

**Expected Result:**
- Tax is enabled on contract
- Future payments will withhold tax

**Test Case 6.2: Process Payment with Tax**
1. Process a payment for any employee
2. Verify tax is withheld

**Expected Result:**
- Employee receives net amount (salary - tax)
- Tax amount is sent to tax recipient
- Payment event shows tax deduction

---

### 7. Withdrawal

**Test Case 7.1: Withdraw Excess Funds**
1. Go to "Withdraw" section
2. Select token (mUSDC or mETH)
3. Enter amount to withdraw
4. Click "Withdraw Funds"
5. Confirm transaction

**Expected Result:**
- Funds are transferred to owner wallet
- Contract balance decreases
- Owner balance increases

**Verification:**
- Check owner wallet balance
- Verify contract balance updated

---

### 8. Access Control

**Test Case 8.1: Founder Dashboard Access**
1. Connect with factory owner wallet
2. Navigate to landing page
3. Verify "Founder Dashboard" button appears

**Test Case 8.2: Non-Owner Access**
1. Connect with different wallet
2. Navigate to landing page
3. Verify "Founder Dashboard" button does NOT appear

**Expected Result:**
- Only factory owner sees founder dashboard
- Other users cannot access treasury functions

---

### 9. Employee Portal

**Test Case 9.1: Employee View**
1. Connect with employee wallet address
2. Navigate to application
3. Verify employee portal loads

**Expected Result:**
- Employee sees their payment history
- Employee can view next payment date
- Employee cannot access admin functions

---

## Edge Cases & Error Handling

### Test Case 10.1: Insufficient Funds
1. Try to process payment with insufficient contract balance
2. Verify error message appears
3. Confirm transaction reverts

### Test Case 10.2: Invalid Employee Address
1. Try to add employee with invalid address
2. Verify validation error

### Test Case 10.3: Duplicate Employee
1. Try to add same employee twice
2. Verify error handling

### Test Case 10.4: Payment Before Due Date
1. Try to process payment before next payment date
2. Verify transaction reverts with appropriate message

---

## Performance Testing

### Load Testing
1. Add 50+ employees via CSV
2. Verify all are added successfully
3. Check gas costs remain reasonable

### Batch Operations
1. Process multiple payments in sequence
2. Verify each completes successfully
3. Monitor gas usage

---

## Security Testing

### Access Control
- Verify only owner can add/remove employees
- Verify only owner can configure hedge vaults
- Verify only owner can withdraw funds

### Reentrancy Protection
- Attempt multiple simultaneous withdrawals
- Verify reentrancy guards work

### Integer Overflow/Underflow
- Test with very large salary amounts
- Test with maximum uint256 values
- Verify SafeMath protections

---

## Regression Testing

After any code changes, run through:
1. Company deployment
2. Add employee
3. Fund contract
4. Configure hedge vault
5. Process payment with hedge vault
6. Verify swap on explorer

---

## Troubleshooting

### Common Issues

**Issue: Transaction Fails**
- Check wallet has sufficient ETH for gas
- Verify contract has sufficient token balance
- Check network connection

**Issue: Balance Not Updating**
- Refresh the page
- Clear browser cache
- Check correct network (Base Sepolia)

**Issue: Hedge Vault Not Working**
- Verify hedge vault is configured
- Check employee address matches exactly
- Verify HedgeVaultManager has liquidity

**Issue: Tokens Not Appearing**
- Add token to MetaMask manually
- Use token addresses from deployment
- Check on Base Sepolia explorer

---

## Test Checklist

- [ ] Deploy company contract
- [ ] Add single employee
- [ ] Add batch employees via CSV
- [ ] Fund contract with mUSDC
- [ ] Fund contract with mETH
- [ ] Configure hedge vault (CONSERVATIVE)
- [ ] Configure hedge vault (MODERATE)
- [ ] Configure hedge vault (AGGRESSIVE)
- [ ] Process regular payment
- [ ] Process payment with hedge vault
- [ ] Verify swap on BaseScan
- [ ] Enable tax withholding
- [ ] Process payment with tax
- [ ] Withdraw funds
- [ ] Remove employee
- [ ] Reactivate employee
- [ ] Test access control
- [ ] Test employee portal
- [ ] Test error handling
- [ ] Verify all events emitted correctly

---

## Reporting Issues

When reporting issues, include:
1. Transaction hash
2. Wallet address
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots/error messages
6. Network (Base Sepolia)

---

## Contact

For testing support:
- Email: decipherlabshq@gmail.com
- Twitter: @DeCipherLabs_HQ

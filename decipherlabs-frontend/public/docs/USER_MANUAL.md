# DeCipherLabs Payroll - User Manual

## Welcome to DeCipherLabs Payroll

This guide will help you get started with DeCipherLabs Payroll, the most affordable and feature-rich Web3 payroll solution.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Setting Up Your Company](#setting-up-your-company)
3. [Managing Employees](#managing-employees)
4. [Funding Your Payroll](#funding-your-payroll)
5. [Processing Payments](#processing-payments)
6. [Hedge Vault Protection](#hedge-vault-protection)
7. [Tax Settings](#tax-settings)
8. [Withdrawing Funds](#withdrawing-funds)
9. [FAQ](#faq)

---

## Getting Started

### What You Need

1. **Web3 Wallet**: MetaMask or compatible wallet
2. **Base Sepolia ETH**: For transaction fees ([Get testnet ETH](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet))
3. **Test Tokens**: mUSDC or mETH for payments

### Connecting Your Wallet

1. Visit the DeCipherLabs Payroll application
2. Click "Connect Wallet"
3. Approve the connection in MetaMask
4. Ensure you're on Base Sepolia network

---

## Setting Up Your Company

### Deploy Your Payroll Contract

1. After connecting, you'll see the setup screen
2. Enter your company name
3. Click "Deploy Company Contract"
4. Confirm the transaction in MetaMask
5. Wait for deployment (usually 10-30 seconds)

**Cost**: ~$0.01 in gas fees

**What Happens**: A dedicated smart contract is created for your company's payroll operations.

---

## Managing Employees

### Adding a Single Employee

1. Go to the **Employees** tab
2. Click "Add Employee"
3. Fill in the details:
   - **Name**: Employee's full name
   - **Wallet Address**: Their crypto wallet address
   - **Salary**: Amount per payment period
   - **Token**: mUSDC (stablecoin) or mETH (volatile)
   - **Frequency**: Weekly, Bi-weekly, or Monthly
4. Click "Add Employee"
5. Confirm transaction

**Tips**:
- Double-check wallet addresses - transactions can't be reversed
- Start with small test amounts
- Use mUSDC for stable, predictable payments

### Adding Multiple Employees (CSV Upload)

1. Download the CSV template
2. Fill in employee details:
   ```
   name,address,salary,token,frequency
   John Doe,0x123...,1000,mUSDC,weekly
   Jane Smith,0x456...,1500,mUSDC,biweekly
   ```
3. Go to **Employees** tab
4. Click "Upload CSV"
5. Select your file
6. Review the preview
7. Click "Upload All"

**Benefits**:
- Add up to 50 employees at once
- Save time on bulk onboarding
- Reduce transaction costs

### Removing an Employee

1. Find the employee in your list
2. Click the **Remove** button
3. Confirm the transaction

**Note**: Removed employees can be reactivated later. Their payment history is preserved.

---

## Funding Your Payroll

### How Much to Fund

Calculate your funding needs:
```
Total Needed = (Total Monthly Salaries × Months) × 1.01
```

The 1.01 accounts for the 1% service fee.

**Example**:
- 10 employees at 1000 mUSDC each = 10,000 mUSDC/month
- For 3 months: 10,000 × 3 × 1.01 = 30,300 mUSDC

### Funding Steps

1. Go to **Funding** tab
2. Select token (mUSDC recommended)
3. Enter amount
4. Review fee breakdown
5. Click "Fund Contract"
6. Approve token spending (first time only)
7. Confirm funding transaction

**Fee Breakdown**:
- Your input: Amount for salaries
- Service fee: 1% (automatically added)
- Total sent: Amount + 1%

**Example**:
- Salary funds: 10,000 mUSDC
- Service fee: 100 mUSDC
- Total: 10,100 mUSDC

---

## Processing Payments

### Manual Payment

1. Go to **Payments** tab
2. Find the employee
3. Click "Pay Now"
4. Confirm transaction

**When to Use**:
- One-time bonuses
- Irregular payment schedules
- Testing the system

### Automatic Payments

Payments are automatically due based on the employee's frequency:
- **Weekly**: Every 7 days
- **Bi-weekly**: Every 14 days
- **Monthly**: Every 30 days

The system shows "Payment Due" when it's time to pay.

### Payment Confirmation

After processing:
- Employee receives tokens in their wallet
- Next payment date is automatically calculated
- Transaction appears on Base Sepolia explorer

**Verify Payment**:
1. Check employee's wallet balance
2. View transaction on [BaseScan](https://sepolia.basescan.org/)
3. Confirm correct amount received

---

## Hedge Vault Protection

### What is a Hedge Vault?

Hedge Vaults protect employees from crypto volatility by splitting their salary between:
- **Stable tokens** (mUSDC): Predictable value
- **Volatile tokens** (mETH): Growth potential

### Risk Levels

| Level | Stable | Volatile | Best For |
|-------|--------|----------|----------|
| **Conservative** | 80% | 20% | Risk-averse employees |
| **Moderate** | 60% | 40% | Balanced approach |
| **Aggressive** | 40% | 60% | Long-term holders |

### Setting Up Hedge Vault

1. Go to **Settings** tab
2. Scroll to "Hedge Vault Configuration"
3. Select employee
4. Choose risk level
5. Set volatility threshold (default: 500 = 5%)
6. Click "Configure Hedge Vault"
7. Confirm transaction

### How It Works

**Example**: 1000 mUSDC salary with Moderate risk

1. Payment initiated: 1000 mUSDC
2. Split: 600 mUSDC + 400 mUSDC
3. Stable portion: 600 mUSDC sent directly
4. Volatile portion: 400 mUSDC swapped to ~400 mETH
5. Employee receives: 600 mUSDC + 400 mETH

**Benefits**:
- Downside protection from stable portion
- Upside potential from volatile portion
- Automatic execution - no manual intervention

---

## Tax Settings

### Enabling Tax Withholding

1. Go to **Settings** tab
2. Find "Tax Settings"
3. Toggle "Enable Tax"
4. Enter tax recipient address
5. Set tax percentage (in basis points: 1000 = 10%)
6. Click "Update Tax Settings"

### How Tax Works

When tax is enabled:
- Tax is automatically withheld from each payment
- Net amount goes to employee
- Tax amount goes to tax recipient

**Example**:
- Gross salary: 1000 mUSDC
- Tax (10%): 100 mUSDC
- Employee receives: 900 mUSDC
- Tax recipient receives: 100 mUSDC

---

## Withdrawing Funds

### When to Withdraw

- Excess funds after payroll period ends
- Closing the company
- Rebalancing token holdings

### Withdrawal Steps

1. Go to **Withdraw** section
2. Select token
3. Enter amount
4. Click "Withdraw Funds"
5. Confirm transaction

**Note**: Only the contract owner can withdraw funds.

---

## FAQ

### General Questions

**Q: What networks are supported?**
A: Currently Base Sepolia (testnet). Base Mainnet coming in Phase 2.

**Q: What tokens can I use?**
A: mUSDC and mETH on testnet. USDC, USDT, DAI, ETH on mainnet.

**Q: What are the fees?**
A: 1% service fee on all payments. No monthly subscription.

### Payment Questions

**Q: Can I change an employee's salary?**
A: Yes, remove and re-add the employee with new salary.

**Q: What if I don't have enough funds?**
A: Payment will fail. Fund the contract before processing payments.

**Q: Can employees withdraw immediately?**
A: Yes, tokens go directly to their wallet.

### Hedge Vault Questions

**Q: Is hedge vault required?**
A: No, it's optional. Employees can receive payments in a single token.

**Q: Can I change risk levels?**
A: Yes, reconfigure the hedge vault anytime.

**Q: What if there's no liquidity for swaps?**
A: On testnet, the MockSwapRouter has pre-funded liquidity. On mainnet, we use Uniswap V3.

### Security Questions

**Q: Who controls the funds?**
A: Only the contract owner (you) can withdraw or manage funds.

**Q: Are contracts audited?**
A: Audit is planned before mainnet launch.

**Q: What if I lose access to my wallet?**
A: Contract ownership cannot be recovered. Use a secure wallet and backup your seed phrase.

---

## Troubleshooting

### Transaction Fails

**Possible Causes**:
- Insufficient gas (ETH)
- Insufficient contract balance
- Wrong network

**Solution**:
- Ensure wallet has ETH for gas
- Check contract balance
- Verify you're on Base Sepolia

### Balance Not Updating

**Solution**:
- Refresh the page
- Clear browser cache
- Check transaction on BaseScan

### Hedge Vault Not Working

**Solution**:
- Verify hedge vault is configured
- Check HedgeVaultManager has liquidity
- Ensure employee address is correct

---

## Getting Help

**Email**: decipherlabshq@gmail.com
**Twitter**: @DeCipherLabs_HQ
**Documentation**: [GitHub](https://github.com/decipherlabs)

---

## Best Practices

1. **Start Small**: Test with small amounts first
2. **Verify Addresses**: Always double-check wallet addresses
3. **Monitor Balances**: Keep contract funded for upcoming payments
4. **Use Hedge Vaults**: Protect employees from volatility
5. **Enable Tax**: Set up tax withholding if required
6. **Keep Records**: Export transaction history regularly

---

**Version**: 1.0
**Last Updated**: December 4, 2024

---

*For technical documentation, see the [Whitepaper](./WHITEPAPER.md)*
*For testing instructions, see the [Testing Guide](./TESTING_GUIDE.md)*

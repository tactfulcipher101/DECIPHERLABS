# DeCipherLabs Payroll Infrastructure

DeCipherLabs Payroll is a decentralized payroll management system that makes it easier for companies to handle employee compensation with crypto. Our platform provides a decentralized, transparent, and automated solution for Web3 organizations, DAOs, and forward-thinking companies.

## Key Features

### Core Features:
- **Multi-token payroll processing** (ETH and ERC-20)
- **Flexible payment schedules** (weekly, biweekly, monthly, or custom)
- **Built-in service fee handling** and treasury management
- **Tax withholding support**
- **Cross-chain payment distribution** for remote teams

### Advanced Features:
- **Volatility Hedge Vaults** (NEW MVP FEATURE) - Automatic risk management for crypto salaries
- **Performance-based salary adjustments** with customizable metrics
- **Salary protection mechanisms** against crypto volatility
- **Self-service features** for employees to manage their payment preferences

### For Employers:
- Easy employee onboarding with bulk CSV uploads
- Custom performance tracking templates for different industries
- Automated payment processing
- Real-time financial reporting

### For Employees:
- Direct wallet payments
- Performance tracking dashboard
- Self-service portal for managing preferences
- **Volatility Hedge Vaults** - Automatic risk management for crypto salaries

## Volatility Hedge Vaults (MVP Feature)

Our unique "Volatility Hedge Vaults" feature provides automatic risk management for crypto salaries:
- **Risk Level Configuration**: Employees can choose from Conservative (20% volatile/80% stable), Moderate (40%/60%), and Aggressive (60%/40%) allocations
- **Automatic Rebalancing**: Monitors portfolio allocation and rebalances when deviating beyond set thresholds
- **Real-time Risk Management**: Automatically adjusts portfolio allocation based on market conditions
- **Customizable Thresholds**: Employers can set volatility thresholds that trigger rebalancing

This feature differentiates us from competitors by providing the first automated volatility protection system for crypto payroll, directly addressing the major concern of crypto salary recipients - volatility risk.

## Development Phases

### Phase 1: Core Infrastructure (Current)
- Multi-token payments (ETH, USDC, USDT, DAI)
- Employee management
- Batch operations
- Basic admin controls
- Payment scheduling (weekly, biweekly, monthly)
- Tax withholding system
- Volatility Hedge Vaults (MVP) - Automatic risk management for crypto salaries

### Phase 2: Advanced Payments (Coming Soon)
- Enhanced salary protection system
- Custom payment schedules
- Advanced treasury management
- Multi-sig support
- Enhanced volatility hedging

### Phase 3: Financial Integration (Coming Soon)
- DeFi yield generation
- Cross-chain operations
- Tax automation
- Compliance tools
- Advanced risk management

### Phase 4: Full Financial Suite (Coming Soon)
- Options-based protection
- DAO integration
- Employee benefits management
- Investment options
- Advanced DeFi integrations

## Project Progress & Implementation Details

### Current Status
- ✅ Complete MVP with Volatility Hedge Vaults ready
- ✅ Deployable smart contract infrastructure on Base network
- ✅ Complete frontend dashboard for payroll management
- ✅ Testnet deployment with mock tokens for testing
- ✅ Working salary advance system (with authorization controls)
- ✅ Employee self-service portal
- ✅ Company admin dashboard with employee management

### Core Architecture
1. **Factory Pattern**: Deploy individual payroll contracts for each company
2. **Upgradeable Contracts**: UUPS proxy pattern for future improvements
3. **Multi-token Support**: ETH and ERC-20 token payments
4. **Hedge Vault Integration**: Automatic stable/volatile token allocation
5. **Frontend Dashboard**: Complete React-based interface for all user types

### Key Features Implemented
- **Employee Management**: Add, remove, update employee details with flexible configurations
- **Payment Processing**: Automated salary payments with multiple scheduling options
- **Tax Withholding**: Built-in tax calculation and collection system
- **Volatility Protection**: Hedge vaults split crypto salaries based on employee risk preference
- **Salary Advances**: Authorized advance system with automatic repayment deduction
- **Wallet Integration**: Seamless MetaMask and Web3 wallet connections

## Technical Implementation Details

### Smart Contracts
- **DeCipherLabsPayrollFactory**: Deploys individual payroll contracts for companies
- **DeCipherLabsPayroll**: Company-specific payroll contracts with employee management
- **HedgeVaultManager**: Handles risk allocation and rebalancing for volatility protection
- **Mock Tokens**: MockStablecoin and MockVolatileToken for testnet deployment

### Frontend Components
- **LandingPage**: Marketing and onboarding interface
- **PayrollDashboard**: Comprehensive company admin dashboard
- **EmployeePortal**: Employee self-service portal
- **FounderDashboard**: Platform admin and treasury management
- **TestingInstructions**: Complete testnet guide

## Challenges Faced & Solutions Implemented

### Challenge 1: Contract Size Limit Exceeded
- **Issue**: Factory contract exceeded the 24,576 byte size limit on mainnet
- **Solutions Implemented**:
  1. **Code Optimization**: Removed all non-essential functionality from the Factory contract
  2. **Storage Layout**: Removed EIP-7201 namespaced storage layout to reduce bytecode size
  3. **Function Removal**: Removed pause/unpause, events, and non-essential view functions
  4. **Solidity Compiler Upgraded**: Updated to Solidity 0.8.26 with optimizer and IR compilation
  5. **Import Minimization**: Removed unnecessary OpenZeppelin imports
- **Result**: Factory contract successfully deploys within size limits

### Challenge 2: Contract Upgradeability vs. Testnet Simplicity
- **Issue**: Upgradeable contracts were preventing testnet deployment due to initializer conflicts
- **Solutions Implemented**:
  1. **Testnet-Only Implementation**: Created non-upgradeable versions for testnet by commenting out upgradeability features
  2. **Constructor Updates**: Changed from upgradeable constructors to regular constructors
  3. **Environment-Specific Code**: Added comments to easily restore upgradeability for mainnet
- **Result**: Contracts deploy successfully on testnet while maintaining mainnet upgrade path

### Challenge 3: Environment Variables in Browser
- **Issue**: `process.env` not available in browser environment causing "process is not defined" errors
- **Solutions Implemented**:
  1. **Vite Environment Handling**: Changed from `process.env` to `import.meta.env` for Vite compatibility
  2. **Fallback Implementation**: Added proper fallback addresses for environment variables
- **Result**: Frontend compiles and runs without environment variable errors

### Challenge 4: Frontend UI Workflow Issues
- **Issue**: Employees could be added before company payroll contract was deployed, causing transaction errors
- **Solutions Implemented**:
  1. **Conditional Rendering**: Added logic to only show employee management after contract deployment
  2. **State Management**: Proper tracking of companyContract state to control UI flow
  3. **User Guidance**: Clear UI flow ensuring contract deployment happens before employee management
- **Result**: Proper workflow prevents errors during contract deployment

### Challenge 5: Token Selection and Management
- **Issue**: Frontend assumed all payments were ETH, no token selection for employees
- **Solutions Implemented**:
  1. **Token Selector**: Added dropdown for mUSDC, mETH, ETH, and USDC options
  2. **Dynamic Contract Addresses**: Updated to handle deployed mock token addresses
  3. **Token Mapping**: Created SUPPORTED_TOKENS configuration with deployed addresses
- **Result**: Proper token selection and handling in frontend

## Deployment & Configuration

### Deployed Addresses (Latest Testnet Deployment)
- **Factory Contract**: `0x2665446f10b6a84698AF91A46D5630E66f9512fA`
- **HedgeVaultManager**: `0xdF68168574Ad49a567e06c8A3f23639B4e6Ac7F2`
- **Mock Stablecoin (mUSDC)**: `0x830367E15F902C9fF5b16966F713Eb91273181D0`
- **Mock Volatile Token (mETH)**: `0x68f715390713C01A73b2458375ad29620af62874`
- **Test Payroll Contract**: `0x7A7Fb1D0Cdf02A8E6910D9E3594E8C344d15d46f`

### Frontend Configuration
All deployed addresses are configured in `src/utils/web3.js` with proper fallbacks and Vite environment variable support.

### Testing Configuration
The `DeployWithMocks.s.sol` script deploys all necessary contracts with:
- Mock stablecoin for stable payments
- Mock volatile token for hedge vault functionality
- HedgeVaultManager for risk allocation
- Factory contract for company payroll deployment
- Automatic token distribution to deployer for immediate testing

## Security & Best Practices

### Security Features
- **Authorization Controls**: Company admins must authorize employee salary advances
- **Hedge Vault Authorization**: Employees must opt-in to volatility protection
- **Rate Limiting**: DoS protection with MAX_PAYROLLS_PER_COMPANY limits
- **Input Validation**: Comprehensive input validation on all functions
- **Reentrancy Protection**: NonReentrant guards on sensitive functions

### Code Quality
- **OpenZeppelin Standards**: Utilizing battle-tested OpenZeppelin contracts
- **Upgradeability Pattern**: UUPS proxy for mainnet with testnet optimizations
- **Gas Optimization**: Minimal state tracking and efficient algorithms
- **Comprehensive Testing**: Ready for security audit and formal verification

## Future Enhancements & Roadmap

### Immediate Priorities
1. **Mainnet Upgradeability**: Restore upgradeability features for production deployment
2. **Advanced Testing**: Comprehensive integration and security testing
3. **User Experience**: Enhanced UI/UX based on user feedback

### Phase 2 Features
1. **Cross-chain Support**: Multi-chain deployment and payments
2. **Advanced Treasury**: Yield generation on unallocated funds
3. **Integration APIs**: Third-party service integrations

### Phase 3 Features
1. **Tax Automation**: Automatic tax calculation and filing
2. **Compliance Tools**: Regulatory compliance features
3. **Advanced DeFi**: Integration with yield farming and other DeFi protocols


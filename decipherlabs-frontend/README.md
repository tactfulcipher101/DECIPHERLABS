# DeCipherLabs Payroll Frontend

DeCipherLabs Payroll is a decentralized payroll management system that makes it easier for companies to handle employee compensation with crypto. Our platform provides a decentralized, transparent, and automated solution for Web3 organizations, DAOs, and forward-thinking companies.

## Key Features

### Core Features:
- **Multi-token payroll processing** (ETH and ERC-20)
- **Flexible payment schedules** (weekly, biweekly, monthly, or custom)
- **Built-in service fee handling** and treasury management
- **Tax withholding support**

### Advanced Features (Phase 1 MVP):
- **Volatility Hedge Vaults** - Automatic risk management for crypto salaries

### For Employers:
- Easy employee onboarding with bulk CSV uploads
- Automated payment processing
- Employee management dashboard

### For Employees:
- Direct wallet payments
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
- **Volatility Hedge Vaults MVP**

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

## Project Setup

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

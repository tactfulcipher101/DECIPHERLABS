import React from 'react';
import { ArrowLeft, CheckSquare, AlertCircle, Zap } from 'lucide-react';

const TestingGuidePage = ({ onNavigate }) => {
    const testCases = [
        { id: 1, title: 'Deploy company contract', category: 'Setup' },
        { id: 2, title: 'Add single employee', category: 'Employees' },
        { id: 3, title: 'Add batch employees via CSV', category: 'Employees' },
        { id: 4, title: 'Fund contract with mUSDC', category: 'Funding' },
        { id: 5, title: 'Fund contract with mETH', category: 'Funding' },
        { id: 6, title: 'Configure hedge vault (Conservative)', category: 'Hedge Vault' },
        { id: 7, title: 'Configure hedge vault (Moderate)', category: 'Hedge Vault' },
        { id: 8, title: 'Configure hedge vault (Aggressive)', category: 'Hedge Vault' },
        { id: 9, title: 'Process regular payment', category: 'Payments' },
        { id: 10, title: 'Process payment with hedge vault', category: 'Payments' },
        { id: 11, title: 'Verify swap on BaseScan', category: 'Verification' },
        { id: 12, title: 'Enable tax withholding', category: 'Tax' },
        { id: 13, title: 'Process payment with tax', category: 'Tax' },
        { id: 14, title: 'Withdraw funds', category: 'Withdrawal' },
        { id: 15, title: 'Remove employee', category: 'Employees' },
        { id: 16, title: 'Reactivate employee', category: 'Employees' }
    ];

    const categories = [...new Set(testCases.map(tc => tc.category))];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <button
                    onClick={() => onNavigate('docs')}
                    className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Documentation</span>
                </button>

                <div className="mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                        Testing Guide
                    </h1>
                    <p className="text-xl text-slate-300">
                        Comprehensive testing instructions for all Phase 1 features
                    </p>
                </div>

                {/* Prerequisites */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-12">
                    <h2 className="text-3xl font-bold text-white mb-6">Prerequisites</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-white mb-3">1. Wallet Setup</h3>
                            <ul className="space-y-2 text-slate-300 mb-4">
                                <li>• Install MetaMask</li>
                                <li>• Add Base Sepolia network</li>
                                <li>• Get testnet ETH from faucet</li>
                            </ul>
                            <div className="flex flex-col gap-2">
                                <a
                                    href="https://www.alchemy.com/faucets/base-sepolia"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition-colors"
                                >
                                    <span>Alchemy Faucet</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                                <a
                                    href="https://bwarelabs.com/faucets/base-sepolia"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm transition-colors"
                                >
                                    <span>Bware Labs Faucet</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-white mb-3">2. Test Tokens</h3>
                            <p className="text-slate-300 mb-2">
                                Claim test tokens (mUSDC and mETH) using the built-in faucet feature.
                            </p>
                            <p className="text-sm text-slate-400">
                                Click "Claim Test Tokens" in the app. 24-hour cooldown per address.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Test Checklist */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-12">
                    <h2 className="text-3xl font-bold text-white mb-6">Test Checklist</h2>
                    <div className="space-y-6">
                        {categories.map(category => (
                            <div key={category}>
                                <h3 className="text-xl font-semibold text-green-400 mb-3">{category}</h3>
                                <div className="space-y-2">
                                    {testCases
                                        .filter(tc => tc.category === category)
                                        .map(tc => (
                                            <div
                                                key={tc.id}
                                                className="flex items-center space-x-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-green-500/50 transition-colors"
                                            >
                                                <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                <span className="text-slate-300">{tc.title}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Critical Test: Hedge Vault */}
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl p-8 mb-12">
                    <div className="flex items-start space-x-4 mb-6">
                        <Zap className="w-8 h-8 text-green-400 flex-shrink-0" />
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Critical Test: Hedge Vault Swap</h2>
                            <p className="text-slate-300">
                                This is the most important test to verify the core functionality of DeCipherLabs Payroll.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
                        <div>
                            <div className="font-semibold text-white mb-2">1. Configure Hedge Vault</div>
                            <div className="text-slate-300 text-sm">
                                Select an employee and set risk level to "Moderate" (60/40 split)
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold text-white mb-2">2. Process Payment</div>
                            <div className="text-slate-300 text-sm">
                                Pay the employee (e.g., 200 mUSDC salary)
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold text-white mb-2">3. Verify on BaseScan</div>
                            <div className="text-slate-300 text-sm mb-2">
                                Check transaction shows 4 token transfers:
                            </div>
                            <div className="bg-slate-800 rounded p-3 space-y-1 text-xs font-mono text-slate-400">
                                <div>1. Payroll → HedgeVaultManager: 200 mUSDC</div>
                                <div>2. HedgeVaultManager → Employee: 120 mUSDC (stable)</div>
                                <div>3. HedgeVaultManager → SwapRouter: 80 mUSDC</div>
                                <div>4. SwapRouter → Employee: 80 mETH (swapped)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Troubleshooting */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
                    <h2 className="text-3xl font-bold text-white mb-6">Troubleshooting</h2>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="font-semibold text-white mb-1">Transaction Fails</div>
                                <div className="text-sm text-slate-300">
                                    Check wallet has sufficient ETH for gas and contract has sufficient token balance
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="font-semibold text-white mb-1">Balance Not Updating</div>
                                <div className="text-sm text-slate-300">
                                    Refresh the page and clear browser cache. Verify you're on Base Sepolia network
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="font-semibold text-white mb-1">Hedge Vault Not Working</div>
                                <div className="text-sm text-slate-300">
                                    Verify hedge vault is configured and employee address matches exactly
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestingGuidePage;

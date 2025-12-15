import React from 'react';
import { ArrowLeft, BookOpen, Shield, Zap, Users, DollarSign } from 'lucide-react';

const WhitepaperPage = ({ onNavigate }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <button
                    onClick={() => onNavigate('docs')}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Documentation</span>
                </button>

                {/* Title */}
                <div className="mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                        DeCipherLabs Payroll
                    </h1>
                    <p className="text-2xl text-slate-300">Technical Whitepaper v1.0</p>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {/* Abstract */}
                    <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
                        <h2 className="text-3xl font-bold text-white mb-4">Abstract</h2>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            DeCipherLabs Payroll is a decentralized payroll infrastructure built on Base Network, designed to streamline
                            cryptocurrency-based salary disbursement for Web3 organizations, DAOs, and remote-first companies. The protocol
                            introduces innovative features including automated hedge vaults for salary protection, multi-token support, and
                            integrated tax withholding, all while maintaining a competitive 1% service fee structure.
                        </p>
                    </section>

                    {/* Problem & Solution */}
                    <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
                        <h2 className="text-3xl font-bold text-white mb-6">The Problem</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                                <DollarSign className="w-8 h-8 text-red-400 mb-3" />
                                <h3 className="text-xl font-semibold text-white mb-2">High Costs</h3>
                                <p className="text-slate-300">Traditional payroll providers charge 3-5% fees plus monthly subscriptions</p>
                            </div>
                            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6">
                                <Zap className="w-8 h-8 text-orange-400 mb-3" />
                                <h3 className="text-xl font-semibold text-white mb-2">Volatility Risk</h3>
                                <p className="text-slate-300">Employees face significant purchasing power fluctuations with crypto salaries</p>
                            </div>
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                                <Users className="w-8 h-8 text-yellow-400 mb-3" />
                                <h3 className="text-xl font-semibold text-white mb-2">Complexity</h3>
                                <p className="text-slate-300">Managing cross-border payments and tax compliance is cumbersome</p>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-6">Our Solution</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                                <Shield className="w-8 h-8 text-green-400 mb-3" />
                                <h3 className="text-xl font-semibold text-white mb-2">1% Service Fee</h3>
                                <p className="text-slate-300">Automated smart contracts eliminate intermediaries, reducing costs to just 1%</p>
                            </div>
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                                <BookOpen className="w-8 h-8 text-blue-400 mb-3" />
                                <h3 className="text-xl font-semibold text-white mb-2">Hedge Vault Technology</h3>
                                <p className="text-slate-300">Protect salary purchasing power through automated token swapping</p>
                            </div>
                        </div>
                    </section>

                    {/* Hedge Vault Mechanism */}
                    <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
                        <h2 className="text-3xl font-bold text-white mb-6">Hedge Vault Mechanism</h2>
                        <p className="text-slate-300 text-lg mb-6">
                            Our flagship innovation protects employees from cryptocurrency volatility while maintaining exposure to potential upside.
                        </p>

                        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-semibold text-white mb-4">Risk Levels</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-600">
                                            <th className="text-left py-3 px-4 text-white">Risk Level</th>
                                            <th className="text-left py-3 px-4 text-white">Stable Allocation</th>
                                            <th className="text-left py-3 px-4 text-white">Volatile Allocation</th>
                                            <th className="text-left py-3 px-4 text-white">Best For</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-300">
                                        <tr className="border-b border-slate-700">
                                            <td className="py-3 px-4 font-semibold text-green-400">Conservative</td>
                                            <td className="py-3 px-4">80%</td>
                                            <td className="py-3 px-4">20%</td>
                                            <td className="py-3 px-4">Risk-averse employees</td>
                                        </tr>
                                        <tr className="border-b border-slate-700">
                                            <td className="py-3 px-4 font-semibold text-blue-400">Moderate</td>
                                            <td className="py-3 px-4">60%</td>
                                            <td className="py-3 px-4">40%</td>
                                            <td className="py-3 px-4">Balanced approach</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-4 font-semibold text-orange-400">Aggressive</td>
                                            <td className="py-3 px-4">40%</td>
                                            <td className="py-3 px-4">60%</td>
                                            <td className="py-3 px-4">Long-term holders</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-white mb-4">Example: 1000 mUSDC Salary (Moderate Risk)</h3>
                            <div className="space-y-3 text-slate-300">
                                <div className="flex items-center justify-between">
                                    <span>1. Payment initiated:</span>
                                    <span className="font-mono text-blue-400">1000 mUSDC</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>2. Stable portion (60%):</span>
                                    <span className="font-mono text-green-400">600 mUSDC → Employee</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>3. Volatile portion (40%):</span>
                                    <span className="font-mono text-orange-400">400 mUSDC → Swap to mETH</span>
                                </div>
                                <div className="border-t border-slate-600 pt-3 mt-3">
                                    <div className="flex items-center justify-between font-semibold">
                                        <span>Employee receives:</span>
                                        <span className="font-mono text-cyan-400">600 mUSDC + 400 mETH</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Smart Contract Architecture */}
                    <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
                        <h2 className="text-3xl font-bold text-white mb-6">Smart Contract Architecture</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">PayrollFactory</h3>
                                <p className="text-slate-300 text-sm">Deploys and manages payroll contracts for organizations</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">DeCipherLabsPayroll</h3>
                                <p className="text-slate-300 text-sm">Core payroll logic for individual organizations</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">HedgeVaultManager</h3>
                                <p className="text-slate-300 text-sm">Manages salary protection through automated token swapping</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">SwapRouter</h3>
                                <p className="text-slate-300 text-sm">Facilitates token swaps for hedge vault operations</p>
                            </div>
                        </div>
                    </section>

                    {/* Security */}
                    <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
                        <h2 className="text-3xl font-bold text-white mb-6">Security Features</h2>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-4">
                                <Shield className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">Reentrancy Protection</h3>
                                    <p className="text-slate-300">All state-changing functions use OpenZeppelin's ReentrancyGuard</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <Shield className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">Access Control</h3>
                                    <p className="text-slate-300">Role-based permissions ensure only authorized actions</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <Shield className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">Emergency Controls</h3>
                                    <p className="text-slate-300">Pause mechanism and emergency withdrawal for critical situations</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Roadmap */}
                    <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
                        <h2 className="text-3xl font-bold text-white mb-6">Roadmap</h2>
                        <div className="space-y-6">
                            <div className="border-l-4 border-green-500 pl-6">
                                <h3 className="text-xl font-semibold text-green-400 mb-2">Phase 1: Core Infrastructure ✅</h3>
                                <ul className="text-slate-300 space-y-1">
                                    <li>✓ Multi-token payment support</li>
                                    <li>✓ Employee management system</li>
                                    <li>✓ Volatility Hedge Vaults (MVP)</li>
                                    <li>✓ Tax withholding integration</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-blue-500 pl-6">
                                <h3 className="text-xl font-semibold text-blue-400 mb-2">Phase 2: Advanced Payments</h3>
                                <ul className="text-slate-300 space-y-1">
                                    <li>• Enhanced Salary Protection</li>
                                    <li>• Custom Payment Schedules</li>
                                    <li>• Advanced Treasury Management</li>
                                    <li>• Multi-sig Support</li>
                                    <li>• Enhanced Volatility Hedging</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-6">
                                <h3 className="text-xl font-semibold text-purple-400 mb-2">Phase 3: Financial Integration</h3>
                                <ul className="text-slate-300 space-y-1">
                                    <li>• DeFi Yield Generation</li>
                                    <li>• Cross-chain Operations</li>
                                    <li>• Tax Automation</li>
                                    <li>• Compliance Tools</li>
                                    <li>• Advanced Risk Management</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-6">
                                <h3 className="text-xl font-semibold text-orange-400 mb-2">Phase 4: Full Financial Suite</h3>
                                <ul className="text-slate-300 space-y-1">
                                    <li>• Options-based Protection</li>
                                    <li>• DAO Integration</li>
                                    <li>• Employee Benefits</li>
                                    <li>• Investment Options</li>
                                    <li>• Advanced DeFi Integrations</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Get Involved</h2>
                        <p className="text-slate-300 mb-6">
                            Join us in revolutionizing Web3 payroll infrastructure
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="mailto:decipherlabshq@gmail.com"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                            >
                                Contact Us
                            </a>
                            <a
                                href="https://twitter.com/DeCipherLabs_HQ"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                            >
                                Follow on Twitter
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WhitepaperPage;

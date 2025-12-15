import React from 'react';
import { ArrowLeft, Wallet, Building, DollarSign, Users, Shield, TrendingUp, CheckCircle } from 'lucide-react';

const UserGuidePage = ({ onNavigate }) => {
    const steps = [
        {
            icon: Wallet,
            title: 'Connect Wallet',
            description: 'Connect your MetaMask wallet and ensure you\'re on Base Sepolia network',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Building,
            title: 'Deploy Contract',
            description: 'Enter your company name and deploy your payroll contract (~$0.01 gas)',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: Users,
            title: 'Add Employees',
            description: 'Add employees individually or upload CSV for batch addition',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: DollarSign,
            title: 'Fund Contract',
            description: 'Fund with mUSDC or mETH. Remember to include 1% service fee',
            color: 'from-yellow-500 to-orange-500'
        },
        {
            icon: Shield,
            title: 'Configure Hedge Vault',
            description: 'Optional: Protect employees from volatility with risk levels',
            color: 'from-red-500 to-pink-500'
        },
        {
            icon: TrendingUp,
            title: 'Process Payments',
            description: 'Click "Pay Now" to process payments with automatic hedge vault splitting',
            color: 'from-indigo-500 to-purple-500'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <button
                    onClick={() => onNavigate('docs')}
                    className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Documentation</span>
                </button>

                <div className="mb-12">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                        User Guide
                    </h1>
                    <p className="text-xl text-slate-300">
                        Step-by-step guide to using DeCipherLabs Payroll
                    </p>
                </div>

                {/* Quick Start */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-12">
                    <h2 className="text-3xl font-bold text-white mb-6">Quick Start</h2>
                    <div className="space-y-6">
                        {steps.map((step, index) => (
                            <div key={index} className="flex items-start space-x-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <step.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="text-sm font-semibold text-slate-400">Step {index + 1}</span>
                                        <h3 className="text-xl font-bold text-white">{step.title}</h3>
                                    </div>
                                    <p className="text-slate-300">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hedge Vault Guide */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-12">
                    <h2 className="text-3xl font-bold text-white mb-6">Understanding Hedge Vaults</h2>
                    <p className="text-slate-300 text-lg mb-6">
                        Hedge Vaults protect employees from crypto volatility by splitting their salary between stable and volatile tokens.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                            <h3 className="text-xl font-bold text-green-400 mb-3">Conservative</h3>
                            <div className="text-3xl font-bold text-white mb-2">80/20</div>
                            <p className="text-slate-300 mb-4">80% stable, 20% volatile</p>
                            <div className="text-sm text-slate-400">
                                Best for risk-averse employees who prioritize stability
                            </div>
                        </div>
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                            <h3 className="text-xl font-bold text-blue-400 mb-3">Moderate</h3>
                            <div className="text-3xl font-bold text-white mb-2">60/40</div>
                            <p className="text-slate-300 mb-4">60% stable, 40% volatile</p>
                            <div className="text-sm text-slate-400">
                                Balanced approach for moderate risk tolerance
                            </div>
                        </div>
                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6">
                            <h3 className="text-xl font-bold text-orange-400 mb-3">Aggressive</h3>
                            <div className="text-3xl font-bold text-white mb-2">40/60</div>
                            <p className="text-slate-300 mb-4">40% stable, 60% volatile</p>
                            <div className="text-sm text-slate-400">
                                For long-term holders seeking growth potential
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fee Structure */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-12">
                    <h2 className="text-3xl font-bold text-white mb-6">Fee Structure</h2>
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-lg text-slate-300">Service Fee</span>
                            <span className="text-3xl font-bold text-blue-400">1%</span>
                        </div>
                        <p className="text-slate-300 mb-4">
                            DeCipherLabs charges just 1% on all payments - significantly lower than traditional payroll providers (3-5%).
                        </p>
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="text-sm font-semibold text-white mb-2">Example:</div>
                            <div className="space-y-2 text-slate-300 text-sm">
                                <div className="flex justify-between">
                                    <span>Salary funds:</span>
                                    <span className="font-mono">10,000 mUSDC</span>
                                </div>
                                <div className="flex justify-between text-yellow-400">
                                    <span>Service fee (1%):</span>
                                    <span className="font-mono">+ 100 mUSDC</span>
                                </div>
                                <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between font-semibold text-white">
                                    <span>Total to send:</span>
                                    <span className="font-mono">10,100 mUSDC</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Best Practices */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
                    <h2 className="text-3xl font-bold text-white mb-6">Best Practices</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="font-semibold text-white mb-1">Start Small</div>
                                <div className="text-sm text-slate-300">Test with small amounts first</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="font-semibold text-white mb-1">Verify Addresses</div>
                                <div className="text-sm text-slate-300">Always double-check wallet addresses</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="font-semibold text-white mb-1">Monitor Balances</div>
                                <div className="text-sm text-slate-300">Keep contract funded for payments</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                            <div>
                                <div className="font-semibold text-white mb-1">Use Hedge Vaults</div>
                                <div className="text-sm text-slate-300">Protect employees from volatility</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGuidePage;

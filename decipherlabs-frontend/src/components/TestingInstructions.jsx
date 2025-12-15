import React, { useState } from 'react';
import { BookOpen, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const TestingInstructions = () => {
  const [activeTab, setActiveTab] = useState('setup');

  const steps = [
    {
      id: 'setup',
      title: 'Contract Setup',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Setting Up for Testing</h3>
          <p className="text-slate-300">
            The DeCipherLabs platform is deployed with mock tokens for testing on Base Sepolia.
            Here's what you need to know:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>MockStablecoin (mUSDC): Used for stable payments and hedge vaults</li>
            <li>MockVolatileToken (mETH): Used for volatile portion of hedge vaults</li>
            <li>Factory Contract: Where companies deploy their payroll contracts</li>
            <li>HedgeVaultManager: Manages risk allocation between stable/volatile assets</li>
          </ul>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>These are MOCK tokens for testing only. They have no real value.</span>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tokens',
      title: 'Getting Test Tokens',
      icon: Play,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Acquiring Test Tokens</h3>
          <p className="text-slate-300">
            Use the built-in faucet to claim test tokens. Click "Claim Test Tokens" in the app to receive:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <h4 className="font-medium text-white mb-2">MockStablecoin (mUSDC)</h4>
              <p className="text-sm text-slate-400">Used for stable portion of hedge vaults</p>
              <p className="text-xs bg-green-900/20 text-green-400 p-2 rounded mt-2">Receive 1,000 mUSDC per claim</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <h4 className="font-medium text-white mb-2">MockVolatileToken (mETH)</h4>
              <p className="text-sm text-slate-400">Used for volatile portion of hedge vaults</p>
              <p className="text-xs bg-yellow-900/20 text-yellow-400 p-2 rounded mt-2">Receive 10 mETH per claim</p>
            </div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4">
            <p className="text-blue-300 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>Faucet has a 24-hour cooldown per address. Plan your testing accordingly.</span>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'hedge',
      title: 'Hedge Vault Testing',
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Testing Hedge Vault Functionality</h3>
          <p className="text-slate-300">
            The Phase 1 MVP includes Volatility Hedge Vaults. Here's how to test them:
          </p>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-full mt-1">
                <span className="text-blue-400 font-bold text-xs">1</span>
              </div>
              <div>
                <h4 className="font-medium text-white">Add Employee</h4>
                <p className="text-sm text-slate-400">Add an employee to your payroll</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-full mt-1">
                <span className="text-blue-400 font-bold text-xs">2</span>
              </div>
              <div>
                <h4 className="font-medium text-white">Configure Hedge Vault</h4>
                <p className="text-sm text-slate-400">
                  Select risk level (Conservative: 20/80, Moderate: 40/60, Aggressive: 60/40)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-500/20 p-2 rounded-full mt-1">
                <span className="text-blue-400 font-bold text-xs">3</span>
              </div>
              <div>
                <h4 className="font-medium text-white">Process Payment</h4>
                <p className="text-sm text-slate-400">
                  When you process a payment, it will be split between stable and volatile assets automatically
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4">
            <h4 className="font-bold text-purple-300 mb-2">Risk Level Examples:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-800/30 p-3 rounded border border-green-500/20">
                <div className="font-medium text-green-400">Conservative</div>
                <div className="text-xs text-slate-400">20% to mETH, 80% to mUSDC</div>
              </div>
              <div className="bg-slate-800/30 p-3 rounded border border-yellow-500/20">
                <div className="font-medium text-yellow-400">Moderate</div>
                <div className="text-xs text-slate-400">40% to mETH, 60% to mUSDC</div>
              </div>
              <div className="bg-slate-800/30 p-3 rounded border border-red-500/20">
                <div className="font-medium text-red-400">Aggressive</div>
                <div className="text-xs text-slate-400">60% to mETH, 40% to mUSDC</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Other Features',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Additional Testing Features</h3>

          <div className="space-y-3">
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <h4 className="font-medium text-white flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Salary Advances</span>
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                Employees can request advances up to 50% of their salary. Test this feature to ensure
                the advance system works correctly with the hedge vault functionality.
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <h4 className="font-medium text-white flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Payment Scheduling</span>
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                Test different payment frequencies (weekly, bi-weekly, monthly) to ensure
                payments are scheduled correctly.
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <h4 className="font-medium text-white flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Tax Withholding</span>
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                Configure tax percentages and test that tax withholding works properly
                with both the main payments and the hedge vault distributions.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Testing Instructions
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Follow these steps to properly test the DeCipherLabs payroll system on Base Sepolia
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveTab(step.id)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${activeTab === step.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              <step.icon className="w-4 h-4" />
              <span>{step.title}</span>
            </button>
          ))}
        </div>

        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          {steps.find(s => s.id === activeTab)?.content}
        </div>

        <div className="mt-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-3">Ready to Test?</h3>
          <p className="text-slate-300 mb-4">
            With your payroll deployed and test tokens received,
            you can now begin testing all Phase 1 features including the Volatility Hedge Vaults.
          </p>
          <p className="text-slate-400 text-sm">
            Remember to always test in a safe environment first. These contracts are still in development
            and should not be used with real funds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestingInstructions;
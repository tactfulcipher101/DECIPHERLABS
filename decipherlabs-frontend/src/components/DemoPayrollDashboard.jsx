import React, { useState } from 'react';
import { 
  Wallet, Plus, Users, DollarSign, Calendar, Settings,
  ArrowLeft, CheckCircle, XCircle, Clock, TrendingUp,
  Gift, Send, RefreshCw, AlertCircle, LogOut, Building2,
  ChevronRight, ChevronDown, PieChart, FileText, Bell,
  Menu, Search, Filter, MoreVertical, Download
} from 'lucide-react';
import { motion } from 'framer-motion';

const DemoPayrollDashboard = ({ account, onConnect, onDisconnect, onDeploy, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxRecipient, setTaxRecipient] = useState('');

  const handleDeploy = async () => {
    if (!companyName) {
      alert('Please enter your company name');
      return;
    }
    setLoading(true);
    try {
      await onDeploy({
        companyName,
        taxRecipient: taxRecipient || account // Use connected wallet as tax recipient if none specified
      });
    } catch (error) {
      console.error('Error deploying contract:', error);
      alert('Failed to deploy contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-950/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('landing')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  DeCipherLabs Payroll
                </h1>
                <p className="text-xs text-slate-500">Demo Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ''}</span>
              <button
                onClick={onDisconnect}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 shadow-xl"
        >
          <div className="text-center mb-8">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h2 className="text-3xl font-bold mb-4">Welcome to DeCipherLabs Payroll</h2>
            <p className="text-slate-400 text-lg">
              Let's set up your organization's payroll smart contract to get started.
            </p>
          </div>

          <div className="space-y-6 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-300">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-blue-300">
                Tax Recipient Address (Optional)
                <span className="block text-xs text-slate-400 font-normal mt-1">
                  If not specified, your connected wallet will be set as the tax recipient
                </span>
              </label>
              <input
                type="text"
                value={taxRecipient}
                onChange={(e) => setTaxRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
              <h4 className="font-semibold mb-2">What happens next?</h4>
              <ul className="space-y-2 text-slate-400">
                <li>• A smart contract will be deployed to manage your payroll</li>
                <li>• You'll be able to add employees and set up salaries</li>
                <li>• Configure payment schedules and token types</li>
                <li>• Process payments with full transparency</li>
              </ul>
            </div>

            <button
              onClick={handleDeploy}
              disabled={loading || !companyName}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Deploying Contract...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5" />
                  <span>Set Up My Organization</span>
                </>
              )}
            </button>

            <p className="text-center text-slate-400 text-sm">
              Deployment requires a one-time transaction to create your organization's smart contract
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DemoPayrollDashboard;
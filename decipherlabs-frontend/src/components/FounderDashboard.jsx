import React, { useState, useEffect } from 'react';
import { Shield, Coins, Users, Settings, DollarSign, Eye, Edit, Plus, Trash2, Search } from 'lucide-react';
import { ethers } from 'ethers';
import { FACTORY_ADDRESS } from '../utils/web3';
import PayrollFactoryABI from '../contracts/PayrollFactory.json';

const FounderDashboard = ({ account, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [factoryContract, setFactoryContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [treasuryInfo, setTreasuryInfo] = useState({
    address: '',
    feeBps: 0,
    totalPayrolls: 0
  });
  const [payrolls, setPayrolls] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newTreasury, setNewTreasury] = useState('');
  const [newFeeBps, setNewFeeBps] = useState('');

  useEffect(() => {
    if (window.ethereum && FACTORY_ADDRESS && FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(FACTORY_ADDRESS, PayrollFactoryABI, provider.getSigner());
      setFactoryContract(contract);
    }
  }, []);

  useEffect(() => {
    if (factoryContract && account) {
      checkOwnership();
      loadTreasuryInfo();
      loadPayrolls();
    }
  }, [factoryContract, account]);

  const checkOwnership = async () => {
    try {
      setCheckingOwner(true);
      const owner = await factoryContract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error('Error checking ownership:', err);
      setIsOwner(false);
    } finally {
      setCheckingOwner(false);
    }
  };

  const loadTreasuryInfo = async () => {
    try {
      const treasury = await factoryContract.decipherlabsTreasury();
      const feeBps = await factoryContract.decipherlabsFeeBps();
      const totalPayrolls = await factoryContract.payrollCount();

      setTreasuryInfo({
        address: treasury,
        feeBps: feeBps,
        totalPayrolls: totalPayrolls.toNumber()
      });
    } catch (err) {
      console.error('Error loading treasury info:', err);
    }
  };

  const loadPayrolls = async () => {
    try {
      const allPayrolls = await factoryContract.getAllPayrolls();
      const payrollDetails = [];

      for (let addr of allPayrolls) {
        // In a real implementation, you'd fetch more details from each payroll contract
        payrollDetails.push({
          address: addr,
          createdAt: new Date().toISOString(), // Would be actual timestamp in real implementation
          isActive: true // Would be actual status in real implementation
        });
      }

      setPayrolls(payrollDetails);
    } catch (err) {
      console.error('Error loading payrolls:', err);
    }
  };

  const updateTreasury = async () => {
    if (!factoryContract || !newTreasury) {
      setError('Please provide a new treasury address');
      return;
    }

    if (!ethers.utils.isAddress(newTreasury)) {
      setError('Invalid treasury address');
      return;
    }

    try {
      setLoading(true);
      const tx = await factoryContract.setTreasury(newTreasury);
      await tx.wait();
      setSuccess('Treasury address updated successfully');
      loadTreasuryInfo();
      setNewTreasury('');
    } catch (err) {
      setError(`Error updating treasury: ${err.message}`);
      console.error('Treasury update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFee = async () => {
    if (!factoryContract || !newFeeBps) {
      setError('Please provide a new fee rate');
      return;
    }

    const feeNum = parseInt(newFeeBps);
    if (isNaN(feeNum) || feeNum > 1000) { // Max 10%
      setError('Invalid fee rate (max 1000 for 10%)');
      return;
    }

    try {
      setLoading(true);
      const tx = await factoryContract.setFeeBps(feeNum);
      await tx.wait();
      setSuccess('Fee rate updated successfully');
      loadTreasuryInfo();
      setNewFeeBps('');
    } catch (err) {
      setError(`Error updating fee: ${err.message}`);
      console.error('Fee update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Access denied for non-owners
  if (checkingOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">Only the factory owner can access the Founder Dashboard.</p>
          <button
            onClick={() => onNavigate && onNavigate('landing')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-950/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                DeCipherLabs Founder Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-300">
                Connected: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connecting...'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Shield },
            { id: 'treasury', label: 'Treasury', icon: DollarSign },
            { id: 'payrolls', label: 'Payrolls', icon: Coins },
            { id: 'companies', label: 'Companies', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <DollarSign className="w-8 h-8 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold">Treasury</h3>
                  <p className="text-sm text-slate-400">Fee Collection</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-400">1.00%</p>
                <p className="text-sm text-slate-400">Current Fee Rate</p>
                <p className="text-sm text-slate-300 font-mono">{treasuryInfo.address}</p>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Coins className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold">Payrolls</h3>
                  <p className="text-sm text-slate-400">Deployed Contracts</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-400">{treasuryInfo.totalPayrolls}</p>
                <p className="text-sm text-slate-400">Total Active</p>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="text-lg font-semibold">Companies</h3>
                  <p className="text-sm text-slate-400">Using Platform</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-purple-400">0</p>
                <p className="text-sm text-slate-400">Connected</p>
              </div>
            </div>
          </div>
        )}

        {/* Treasury Management Tab */}
        {activeTab === 'treasury' && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <DollarSign className="w-6 h-6" />
                <span>Treasury Configuration</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Current Treasury Address
                    </label>
                    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg font-mono text-sm">
                      {treasuryInfo.address}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Current Fee Rate
                    </label>
                    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                      {treasuryInfo.feeBps / 100}% ({treasuryInfo.feeBps} bps)
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      New Treasury Address
                    </label>
                    <input
                      type="text"
                      value={newTreasury}
                      onChange={(e) => setNewTreasury(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={updateTreasury}
                      disabled={loading}
                      className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white transition-colors disabled:opacity-50"
                    >
                      Update Treasury
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      New Fee Rate (basis points)
                    </label>
                    <input
                      type="number"
                      value={newFeeBps}
                      onChange={(e) => setNewFeeBps(e.target.value)}
                      placeholder="100 = 1%"
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={updateFee}
                      disabled={loading}
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors disabled:opacity-50"
                    >
                      Update Fee Rate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payrolls Tab */}
        {activeTab === 'payrolls' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Coins className="w-6 h-6" />
              <span>Deployed Payroll Contracts</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-slate-400 font-medium">Contract</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Created</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((payroll, index) => (
                    <tr key={index} className="border-b border-slate-800">
                      <td className="py-3 font-mono text-sm">
                        {payroll.address.slice(0, 6)}...{payroll.address.slice(-4)}
                      </td>
                      <td className="py-3 text-sm text-slate-400">
                        {payroll.createdAt}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${payroll.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                          }`}>
                          {payroll.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex space-x-2">
                          <button className="p-1 hover:bg-slate-800 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 hover:bg-slate-800 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Users className="w-6 h-6" />
              <span>Managing Companies</span>
            </h2>

            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No companies registered yet.</p>
              <p className="text-sm">Companies will appear here once they deploy payroll contracts.</p>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 max-w-md">
          {error}
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 max-w-md">
          {success}
        </div>
      )}
    </div>
  );
};

export default FounderDashboard;
import React, { useState, useEffect } from 'react';
import { 
  Wallet, DollarSign, Calendar, Clock, TrendingUp,
  ArrowLeft, CheckCircle, XCircle, RefreshCw,
  ExternalLink, Edit, AlertCircle, Download, LogOut
} from 'lucide-react';
import {
  formatAddress,
  formatTimestamp,
  formatTokenAmount,
  getExplorerUrl,
  getContract,
  handleTransactionError,
  calculateFees
} from '../utils/web3';
import PayrollABI from '../contracts/DeCipherLabsPayroll.json';

const EmployeePortal = ({ account, payrollAddress, employeeData, onDisconnect, onNavigate }) => {
  const [showUpdateWallet, setShowUpdateWallet] = useState(false);
  const [newWallet, setNewWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employee, setEmployee] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [vestingInfo, setVestingInfo] = useState(null);

  useEffect(() => {
    if (account && payrollAddress) {
      loadEmployeeData();
    }
  }, [account, payrollAddress]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const contract = await getContract(payrollAddress, PayrollABI);
      
      // Get employee details
      const empData = await contract.getEmployee(account);
      setEmployee(empData);

      // Get payment history
      const history = await contract.getPaymentHistory(account);
      setPaymentHistory(history || []);

      // Get vesting info
      const releasable = await contract.releasableVested(account);
      if (releasable > 0) {
        setVestingInfo({
          releasable,
          vesting: empData.vesting
        });
      }
    } catch (err) {
      console.error('Error loading employee data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWallet = async () => {
    if (!newWallet || newWallet.length !== 42 || !newWallet.startsWith('0x')) {
      setError('Please enter a valid wallet address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const contract = await getContract(payrollAddress, PayrollABI);
      const tx = await contract.updateMyWallet(newWallet);
      await tx.wait();
      
      setSuccess('Wallet address updated successfully! Please reconnect with your new wallet.');
      setShowUpdateWallet(false);
      setNewWallet('');
      
      // Disconnect after wallet update
      setTimeout(() => {
        onDisconnect();
      }, 3000);
    } catch (err) {
      console.error('Error updating wallet:', err);
      setError(handleTransactionError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setLoading(true);
      setError('');
      
      const contract = await getContract(payrollAddress, PayrollABI);
      const tx = await contract.claim();
      await tx.wait();
      
      setSuccess('Funds claimed successfully!');
      await loadEmployeeData();
    } catch (err) {
      console.error('Error claiming funds:', err);
      setError(handleTransactionError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseVested = async () => {
    try {
      setLoading(true);
      setError('');
      
      const contract = await getContract(payrollAddress, PayrollABI);
      const tx = await contract.releaseVested();
      await tx.wait();
      
      setSuccess('Vested tokens released successfully!');
      await loadEmployeeData();
    } catch (err) {
      console.error('Error releasing vested tokens:', err);
      setError(handleTransactionError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-white text-xl">Loading employee data...</p>
        </div>
      </div>
    );
  }

  const salary = formatTokenAmount(employee.salaryPerPeriod, 18);
  const fees = calculateFees(salary, 100, Number(employee.taxBps));
  const owedAmount = formatTokenAmount(employee.owed, 18);

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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                My Payroll Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400">{formatAddress(account)}</span>
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

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-400">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Employee Info Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
              <p className="text-slate-400">View your payment information and manage your account</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold ${
              employee.active 
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}>
              {employee.active ? 'Active Employee' : 'Inactive'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-400">Salary (Gross)</span>
              </div>
              <p className="text-2xl font-bold">${salary} USDC</p>
              <p className="text-xs text-slate-500 mt-1">Before deductions</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-400">Next Payment</span>
              </div>
              <p className="text-lg font-bold">{formatTimestamp(employee.nextPayTimestamp)}</p>
              <p className="text-xs text-slate-500 mt-1">Scheduled payment date</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-slate-400">Pending Claims</span>
              </div>
              <p className="text-2xl font-bold">${owedAmount} USDC</p>
              <p className="text-xs text-slate-500 mt-1">Available to claim</p>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-6">Payment Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <span className="text-slate-400">Gross Salary</span>
              <span className="font-semibold">${fees.gross} USDC</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <span className="text-slate-400">Platform Fee (1%)</span>
              <span className="text-red-400">-${fees.fee} USDC</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <span className="text-slate-400">Tax ({Number(employee.taxBps) / 100}%)</span>
              <span className="text-red-400">-${fees.tax} USDC</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg">
              <span className="font-bold text-lg">Net Payment</span>
              <span className="text-2xl font-bold text-green-400">${fees.net} USDC</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
            <div className="space-y-4">
              {Number(owedAmount) > 0 && (
                <button
                  onClick={handleClaim}
                  disabled={loading}
                  className="w-full p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-6 h-6 text-green-400" />
                    <div className="text-left">
                      <h4 className="font-semibold">Claim Pending Payments</h4>
                      <p className="text-sm text-slate-400">${owedAmount} USDC available</p>
                    </div>
                  </div>
                  {loading ? (
                    <RefreshCw className="w-5 h-5 text-green-400 animate-spin" />
                  ) : (
                    <span className="text-green-400">Claim</span>
                  )}
                </button>
              )}

              {vestingInfo && Number(formatTokenAmount(vestingInfo.releasable, 18)) > 0 && (
                <button
                  onClick={handleReleaseVested}
                  disabled={loading}
                  className="w-full p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-purple-400" />
                    <div className="text-left">
                      <h4 className="font-semibold">Release Vested Tokens</h4>
                      <p className="text-sm text-slate-400">
                        ${formatTokenAmount(vestingInfo.releasable, 18)} USDC available
                      </p>
                    </div>
                  </div>
                  {loading ? (
                    <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                  ) : (
                    <span className="text-purple-400">Release</span>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowUpdateWallet(true)}
                className="w-full p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Edit className="w-6 h-6 text-blue-400" />
                  <div className="text-left">
                    <h4 className="font-semibold">Update Wallet Address</h4>
                    <p className="text-sm text-slate-400">Change payment destination</p>
                  </div>
                </div>
                <span className="text-blue-400">Update</span>
              </button>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">Payment History</h3>
            <div className="space-y-4">
              {paymentHistory.length > 0 ? (
                paymentHistory.map((payment, idx) => (
                  <div key={idx} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          payment.isBonus ? 'bg-purple-400' : 'bg-green-400'
                        }`}></div>
                        <span className="font-semibold">{payment.isBonus ? 'Bonus' : 'Salary'}</span>
                      </div>
                      <span className="text-green-400 font-bold">
                        ${formatTokenAmount(payment.amount, 18)} USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>{formatTimestamp(payment.timestamp)}</span>
                      {payment.memo && <span className="text-xs italic">{payment.memo}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No payment history yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update Wallet Modal */}
        {showUpdateWallet && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-blue-500/20 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Update Wallet Address</h3>
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-400">
                    <p className="font-semibold mb-1">Important</p>
                    <p>Future payments will be sent to the new wallet. You'll need to reconnect with the new wallet after updating.</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Current Wallet</label>
                <div className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-400">
                  {formatAddress(account)}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">New Wallet Address</label>
                <input
                  type="text"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowUpdateWallet(false);
                    setNewWallet('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateWallet}
                  disabled={loading || !newWallet}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Wallet</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePortal;
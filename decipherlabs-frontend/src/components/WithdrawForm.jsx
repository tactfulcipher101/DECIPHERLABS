import React, { useState } from 'react';
import { ethers } from 'ethers';
import { DollarSign, AlertCircle, Info, ArrowLeft } from 'lucide-react';
import { getProviderAndSigner, SUPPORTED_TOKENS } from '../utils/web3';

const PAYROLL_ABI = [
    'function emergencyWithdraw(address token, uint256 amount)'
];

const ERC20_ABI = [
    'function balanceOf(address account) view returns (uint256)'
];

const WithdrawForm = ({ companyContract, onSuccess, onError, setActionLoading, actionLoading, contractBalance }) => {
    const [amount, setAmount] = useState('');
    const [tokenAddress, setTokenAddress] = useState(SUPPORTED_TOKENS.mUSDC.address); // Default to mUSDC

    const handleWithdraw = async () => {
        try {
            setActionLoading('withdrawing');
            onError('');

            const { signer } = await getProviderAndSigner();
            const payroll = new ethers.Contract(companyContract, PAYROLL_ABI, signer);

            const amountInWei = ethers.utils.parseUnits(amount, 18);

            console.log('Withdrawing:', amount, 'tokens');
            const tx = await payroll.emergencyWithdraw(tokenAddress, amountInWei);
            await tx.wait();

            onSuccess();
            setAmount('');
        } catch (err) {
            console.error('Error withdrawing:', err);
            onError(err.message || 'Failed to withdraw funds');
        } finally {
            setActionLoading('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            onError('Please enter a valid amount');
            return;
        }

        await handleWithdraw();
    };

    const getTokenName = () => {
        if (tokenAddress === SUPPORTED_TOKENS.mUSDC.address) return 'mUSDC';
        if (tokenAddress === SUPPORTED_TOKENS.mETH.address) return 'mETH';
        if (tokenAddress === ethers.constants.AddressZero) return 'ETH';
        return 'tokens';
    };

    const getAvailableBalance = () => {
        if (tokenAddress === SUPPORTED_TOKENS.mUSDC.address) {
            return contractBalance?.usdc || '0';
        }
        if (tokenAddress === SUPPORTED_TOKENS.mETH.address) {
            return contractBalance?.meth || '0';
        }
        if (tokenAddress === ethers.constants.AddressZero) {
            return contractBalance?.eth || '0';
        }
        return '0';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Token Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Token to Withdraw</label>
                <select
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none cursor-pointer appearance-none"
                >
                    <option value={SUPPORTED_TOKENS.mUSDC.address} className="bg-slate-800 text-white">mUSDC (Mock Stablecoin)</option>
                    <option value={SUPPORTED_TOKENS.mETH.address} className="bg-slate-800 text-white">mETH (Mock Volatile Token)</option>
                    <option value={ethers.constants.AddressZero} className="bg-slate-800 text-white">ETH (Native)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Available: {parseFloat(getAvailableBalance()).toFixed(4)} {getTokenName()}</p>
            </div>

            {/* Amount Input */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount to Withdraw ({getTokenName()})
                </label>
                <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., 100"
                />
                <button
                    type="button"
                    onClick={() => setAmount(getAvailableBalance())}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                    Withdraw Max
                </button>
            </div>

            {/* Info Alert */}
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                    <p className="font-medium text-white mb-1">⚠️ Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Only withdraw funds you don't need for upcoming payroll</li>
                        <li>Ensure sufficient balance remains for employee salaries</li>
                        <li>This action is immediate and cannot be undone</li>
                    </ul>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={actionLoading === 'withdrawing' || !amount || parseFloat(amount) <= 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
                {actionLoading === 'withdrawing' ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <DollarSign className="w-5 h-5" />
                        <span>Withdraw Funds</span>
                    </>
                )}
            </button>
        </form>
    );
};

export default WithdrawForm;

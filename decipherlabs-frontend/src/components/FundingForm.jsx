import React, { useState } from 'react';
import { ethers } from 'ethers';
import { DollarSign, AlertCircle, Info } from 'lucide-react';
import { getProviderAndSigner, USDC_ADDRESS, SUPPORTED_TOKENS } from '../utils/web3';

const PAYROLL_ABI = [
    'function fundWithERC20(address token, uint256 amount)'
];

const ERC20_ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)'
];

const FundingForm = ({ companyContract, onSuccess, onError, setActionLoading, actionLoading }) => {
    const [amount, setAmount] = useState('');
    const [tokenAddress, setTokenAddress] = useState(USDC_ADDRESS); // Default to mUSDC

    // Calculate fee (1%)
    const calculateFee = (amt) => {
        if (!amt || isNaN(amt)) return { fee: '0', total: '0', netToContract: '0' };
        const amountNum = parseFloat(amt);
        const fee = amountNum * 0.01;
        const total = amountNum + fee;
        return {
            fee: fee.toFixed(4),
            total: total.toFixed(4),
            netToContract: amountNum.toFixed(4)
        };
    };

    const feeCalc = calculateFee(amount);

    const handleFundERC20 = async () => {
        try {
            if (!companyContract) {
                onError('Contract address not loaded. Please refresh the page.');
                return;
            }

            setActionLoading('funding');
            onError('');

            const { signer } = await getProviderAndSigner();
            const account = await signer.getAddress();
            const payroll = new ethers.Contract(companyContract, PAYROLL_ABI, signer);
            const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

            // Calculate total amount including 1% fee
            const amountInWei = ethers.utils.parseUnits(feeCalc.total, 18);

            // Check balance
            const balance = await token.balanceOf(account);
            if (balance.lt(amountInWei)) {
                throw new Error(`Insufficient token balance. You have ${ethers.utils.formatUnits(balance, 18)} tokens`);
            }

            // Check and approve if needed
            let allowance = await token.allowance(account, companyContract);
            console.log('Current allowance:', ethers.utils.formatUnits(allowance, 18));

            if (allowance.lt(amountInWei)) {
                console.log('Approving tokens...');
                const approveTx = await token.approve(companyContract, amountInWei);
                setActionLoading('approving');
                await approveTx.wait();
                console.log('Tokens approved');

                // Verify allowance updated (wait for indexer if needed)
                let retries = 5;
                while (retries > 0) {
                    allowance = await token.allowance(account, companyContract);
                    if (allowance.gte(amountInWei)) break;

                    console.log('Waiting for allowance update...', retries);
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2s
                    retries--;
                }

                if (allowance.lt(amountInWei)) {
                    throw new Error('Approval transaction confirmed but allowance not updated. Please try again.');
                }
            }

            setActionLoading('funding');
            console.log('Funding with ERC20:', feeCalc.total, 'tokens');

            // Add manual gas limit override if needed to bypass erratic estimation
            const tx = await payroll.fundWithERC20(tokenAddress, amountInWei, {
                gasLimit: 300000 // Safe buffer for this operation
            });
            await tx.wait();

            onSuccess();
            setAmount('');
        } catch (err) {
            console.error('Error funding with ERC20:', err);
            // Handle "execution reverted" specifically
            if (err.code === 'UNPREDICTABLE_GAS_LIMIT' || err.message?.includes('execution reverted')) {
                if (err.message?.includes('0xfb8f41b2')) {
                    onError('Transaction failed: Insufficient Allowance. Please try again.');
                } else {
                    onError('Transaction failed: Execution reverted. Check your balance and try again.');
                }
            } else {
                onError(err.message || 'Failed to fund with tokens');
            }
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

        await handleFundERC20();
    };

    const getTokenName = () => {
        if (tokenAddress === USDC_ADDRESS) return 'mUSDC';
        if (tokenAddress === SUPPORTED_TOKENS['mETH'].address) return 'mETH';
        return 'tokens';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Token Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Token</label>
                <select
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none cursor-pointer appearance-none"
                >
                    <option value={USDC_ADDRESS} className="bg-slate-800 text-white">mUSDC (Mock Stablecoin)</option>
                    <option value={SUPPORTED_TOKENS['mETH'].address} className="bg-slate-800 text-white">mETH (Mock Volatile Token)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Choose which token to fund the contract with</p>
            </div>

            {/* Amount Input */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount to Deposit ({getTokenName()})
                </label>
                <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., 1000"
                />
                <p className="text-xs text-slate-500 mt-1">Enter the amount you want available for salaries</p>
            </div>

            {/* Fee Breakdown */}
            {amount && parseFloat(amount) > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-blue-400 font-medium mb-3">
                        <Info className="w-4 h-4" />
                        <span>Fee Breakdown</span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-slate-300">
                            <span>Amount for Salaries:</span>
                            <span className="font-mono">{feeCalc.netToContract} {getTokenName()}</span>
                        </div>
                        <div className="flex justify-between text-yellow-400">
                            <span>Service Fee (1%):</span>
                            <span className="font-mono">+{feeCalc.fee} {getTokenName()}</span>
                        </div>
                        <div className="border-t border-slate-600 my-2"></div>
                        <div className="flex justify-between text-white font-bold">
                            <span>Total You'll Send:</span>
                            <span className="font-mono">{feeCalc.total} {getTokenName()}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                    <p className="font-medium text-white mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>You send the total amount (salary funds + 1% fee)</li>
                        <li>1% automatically goes to DeCipherLabs treasury</li>
                        <li>Remaining amount is available for employee salaries</li>
                        <li>Employees receive their full intended salaries</li>
                    </ul>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={actionLoading === 'funding' || !amount || parseFloat(amount) <= 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
                {actionLoading === 'funding' ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <DollarSign className="w-5 h-5" />
                        <span>Fund Contract</span>
                    </>
                )}
            </button>
        </form>
    );
};

export default FundingForm;

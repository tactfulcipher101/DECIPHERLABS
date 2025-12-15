import React, { useState, useEffect } from 'react';
import { Droplet, Clock, Coins, AlertCircle, CheckCircle } from 'lucide-react';
import { getProviderAndSigner } from '../utils/web3';
import { claimTokens, checkCanClaim, getFaucetInfo, formatTimeUntilClaim } from '../utils/faucet';

const TokenFaucet = ({ account }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [canClaim, setCanClaim] = useState(false);
    const [timeUntilNextClaim, setTimeUntilNextClaim] = useState(0);
    const [faucetInfo, setFaucetInfo] = useState(null);

    useEffect(() => {
        if (account) {
            loadFaucetData();
        }
    }, [account]);

    const loadFaucetData = async () => {
        try {
            const { provider } = await getProviderAndSigner();

            // Check if user can claim
            const claimStatus = await checkCanClaim(account, provider);
            setCanClaim(claimStatus.canClaim);
            setTimeUntilNextClaim(claimStatus.timeUntilNextClaim);

            // Get faucet info
            const info = await getFaucetInfo(provider);
            setFaucetInfo(info);
        } catch (err) {
            console.error('Error loading faucet data:', err);
            if (!err.message.includes('Faucet not deployed')) {
                setError('Failed to load faucet data');
            }
        }
    };

    const handleClaim = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { signer } = await getProviderAndSigner();
            await claimTokens(signer);

            setSuccess('Successfully claimed test tokens! Check your wallet.');
            await loadFaucetData(); // Refresh data
        } catch (err) {
            console.error('Claim error:', err);
            setError(err.message || 'Failed to claim tokens');
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
                    <Droplet className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Token Faucet</h2>
                    <p className="text-gray-400">Please connect your wallet to claim test tokens</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
            <div className="max-w-2xl mx-auto pt-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Droplet className="w-12 h-12 text-blue-400 mr-3" />
                        <h1 className="text-4xl font-bold text-white">Test Token Faucet</h1>
                    </div>
                    <p className="text-gray-300 text-lg">
                        Get free test tokens for testing the DeCipherLabs Payroll system
                    </p>
                </div>

                {/* Faucet Info Card */}
                {faucetInfo && (
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 mb-6">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                            <Coins className="w-5 h-5 mr-2 text-yellow-400" />
                            Distribution Info
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Per Claim</p>
                                <p className="text-white font-semibold">{faucetInfo.stableAmountPerClaim} mUSDC</p>
                                <p className="text-white font-semibold">{faucetInfo.volatileAmountPerClaim} mETH</p>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Cooldown</p>
                                <p className="text-white font-semibold">{faucetInfo.cooldownPeriodHours} hours</p>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Faucet Balance</p>
                                <p className="text-green-400 font-semibold text-sm">{parseFloat(faucetInfo.stableBalance).toLocaleString()} mUSDC</p>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Faucet Balance</p>
                                <p className="text-blue-400 font-semibold text-sm">{parseFloat(faucetInfo.volatileBalance).toLocaleString()} mETH</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Claim Card */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Droplet className="w-10 h-10 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Claim Test Tokens</h2>
                        <p className="text-gray-400">
                            Get test tokens to try out the payroll system
                        </p>
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-green-400 text-sm">{success}</p>
                        </div>
                    )}

                    {/* Cooldown Timer */}
                    {!canClaim && timeUntilNextClaim > 0 && (
                        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                            <div className="flex items-center justify-center text-yellow-400">
                                <Clock className="w-5 h-5 mr-2" />
                                <span className="font-semibold">
                                    Next claim available in: {formatTimeUntilClaim(timeUntilNextClaim)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Claim Button */}
                    <button
                        onClick={handleClaim}
                        disabled={!canClaim || loading}
                        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${canClaim && !loading
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Claiming...
                            </span>
                        ) : canClaim ? (
                            'Claim Test Tokens'
                        ) : (
                            'Claim Not Available'
                        )}
                    </button>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-300 text-sm">
                            <strong>Note:</strong> These are test tokens for development purposes only.
                            You can claim tokens anytime - no cooldown period!
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">How to use:</h3>
                    <ol className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">1</span>
                            <span>Click "Claim Test Tokens" to receive mUSDC and mETH</span>
                        </li>
                        <li className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">2</span>
                            <span>Use these tokens to fund your payroll contract</span>
                        </li>
                        <li className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">3</span>
                            <span>Test employee payments and hedge vault features</span>
                        </li>
                        <li className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">4</span>
                            <span>Claim more tokens anytime you need them - no waiting!</span>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default TokenFaucet;

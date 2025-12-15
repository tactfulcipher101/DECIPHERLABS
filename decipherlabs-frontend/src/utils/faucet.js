import { ethers } from 'ethers';

// Deployed on Base Sepolia Testnet
export const FAUCET_ADDRESS = '0x3BFC31Ce8A2B1E0e758AfCDaa33766335112016a';

const FAUCET_ABI = [
    'function claimTokens() external',
    'function canClaim(address user) external view returns (bool canClaim, uint256 timeUntilNextClaim)',
    'function getFaucetBalance() external view returns (uint256 stableBalance, uint256 volatileBalance)',
    'function stableAmount() external view returns (uint256)',
    'function volatileAmount() external view returns (uint256)',
    'function cooldownPeriod() external view returns (uint256)',
    'function lastClaimTime(address) external view returns (uint256)'
];

/**
 * Check if a user can claim tokens from the faucet
 * @param {string} userAddress - User's wallet address
 * @param {object} provider - Ethers provider
 * @returns {Promise<{canClaim: boolean, timeUntilNextClaim: number}>}
 */
export const checkCanClaim = async (userAddress, provider) => {
    try {
        if (FAUCET_ADDRESS === '0x0000000000000000000000000000000000000000') {
            throw new Error('Faucet not deployed yet');
        }

        const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
        const [canClaim, timeUntilNextClaim] = await faucet.canClaim(userAddress);

        return {
            canClaim,
            timeUntilNextClaim: timeUntilNextClaim.toNumber()
        };
    } catch (error) {
        console.error('Error checking claim status:', error);
        throw error;
    }
};

/**
 * Claim tokens from the faucet
 * @param {object} signer - Ethers signer
 * @returns {Promise<boolean>}
 */
export const claimTokens = async (signer) => {
    try {
        if (FAUCET_ADDRESS === '0x0000000000000000000000000000000000000000') {
            throw new Error('Faucet not deployed yet. Please update FAUCET_ADDRESS in faucet.js');
        }

        const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);

        console.log('Claiming tokens from faucet...');
        const tx = await faucet.claimTokens();
        console.log('Transaction sent:', tx.hash);

        const receipt = await tx.wait();
        console.log('Tokens claimed successfully!', receipt.transactionHash);

        return true;
    } catch (error) {
        console.error('Error claiming tokens:', error);

        // Parse error messages
        if (error.message.includes('Cooldown period not elapsed')) {
            throw new Error('You can only claim tokens once every 24 hours. Please try again later.');
        } else if (error.message.includes('Insufficient stable tokens')) {
            throw new Error('Faucet is out of stable tokens. Please contact support.');
        } else if (error.message.includes('Insufficient volatile tokens')) {
            throw new Error('Faucet is out of volatile tokens. Please contact support.');
        }

        throw error;
    }
};

/**
 * Get faucet balance and distribution info
 * @param {object} provider - Ethers provider
 * @returns {Promise<object>}
 */
export const getFaucetInfo = async (provider) => {
    try {
        if (FAUCET_ADDRESS === '0x0000000000000000000000000000000000000000') {
            throw new Error('Faucet not deployed yet');
        }

        const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);

        const [stableBalance, volatileBalance] = await faucet.getFaucetBalance();
        const stableAmount = await faucet.stableAmount();
        const volatileAmount = await faucet.volatileAmount();
        const cooldownPeriod = await faucet.cooldownPeriod();

        return {
            stableBalance: ethers.utils.formatUnits(stableBalance, 18),
            volatileBalance: ethers.utils.formatUnits(volatileBalance, 18),
            stableAmountPerClaim: ethers.utils.formatUnits(stableAmount, 18),
            volatileAmountPerClaim: ethers.utils.formatUnits(volatileAmount, 18),
            cooldownPeriodHours: cooldownPeriod.toNumber() / 3600
        };
    } catch (error) {
        console.error('Error getting faucet info:', error);
        throw error;
    }
};

/**
 * Format time until next claim
 * @param {number} seconds - Seconds until next claim
 * @returns {string}
 */
export const formatTimeUntilClaim = (seconds) => {
    if (seconds <= 0) return 'Now';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
};

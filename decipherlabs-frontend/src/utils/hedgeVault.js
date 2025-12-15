
import { ethers } from 'ethers';
import { USDC_ADDRESS, SUPPORTED_TOKENS } from './web3';

/**
 * Configure hedge vault for an employee
 * @param {string} payrollContractAddress - Payroll contract address
 * @param {string} employeeAddress - Employee wallet address
 * @param {string} riskLevel - Risk level: 'CONSERVATIVE', 'MODERATE', or 'AGGRESSIVE'
 * @param {number} volatilityThreshold - Volatility threshold in basis points (e.g., 500 = 5%)
 * @param {ethers.Signer} signer - Ethereum signer
 * @returns {Promise<boolean>} - True if successful
 */
export const configureEmployeeHedgeVault = async (payrollContractAddress, employeeAddress, riskLevel, volatilityThreshold, signer) => {
    try {
        console.log('🔧 Configuring hedge vault for employee:', employeeAddress);
        console.log('📊 Risk level:', riskLevel);
        console.log('📈 Volatility threshold:', volatilityThreshold);
        console.log('📄 Payroll contract:', payrollContractAddress);

        // Get mETH address from SUPPORTED_TOKENS
        const volatileTokenAddress = SUPPORTED_TOKENS['mETH'].address;
        const stableTokenAddress = SUPPORTED_TOKENS['mUSDC'].address;

        console.log('💎 Using mETH as volatile token:', volatileTokenAddress);
        console.log('💵 Using mUSDC as stable token:', stableTokenAddress);

        // Payroll contract ABI for configureHedgeVault
        const PAYROLL_ABI = [
            'function configureHedgeVault(address employee, uint8 riskLevel, uint256 volatilityThreshold, address volatileToken, address stableToken)'
        ];

        const payrollContract = new ethers.Contract(
            payrollContractAddress,
            PAYROLL_ABI,
            signer
        );

        // Convert risk level string to enum value
        let riskLevelEnum;
        switch (riskLevel.toUpperCase()) {
            case 'CONSERVATIVE':
                riskLevelEnum = 0; // 20% volatile, 80% stable
                break;
            case 'MODERATE':
                riskLevelEnum = 1; // 40% volatile, 60% stable
                break;
            case 'AGGRESSIVE':
                riskLevelEnum = 2; // 60% volatile, 40% stable
                break;
            default:
                riskLevelEnum = 1; // Default to MODERATE
        }

        console.log('📤 Calling configureHedgeVault with params:', {
            employee: employeeAddress,
            riskLevel: riskLevelEnum,
            volatilityThreshold,
            volatileToken: volatileTokenAddress,
            stableToken: stableTokenAddress
        });

        const tx = await payrollContract.configureHedgeVault(
            employeeAddress,
            riskLevelEnum,
            volatilityThreshold,
            volatileTokenAddress,  // mETH - THIS IS THE KEY FIX!
            stableTokenAddress     // mUSDC
        );

        console.log('⏳ Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('✅ Hedge vault configured successfully:', receipt.transactionHash);
        return true;
    } catch (error) {
        console.error('❌ Error configuring hedge vault:', error);
        throw error;
    }
};

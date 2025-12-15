import { ethers } from 'ethers';
import { FACTORY_ADDRESS, USDC_ADDRESS, SUPPORTED_TOKENS, HEDGE_VAULT_MANAGER_ADDRESS } from './web3';
import PayrollFactoryABI from '../contracts/DeCipherLabsPayrollFactory.json';

if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
    window.global = window;
}
console.log('🔧 PayrollContract VERSION: HEDGE-FIX-v3');
console.log('🏭 Using Factory Address:', FACTORY_ADDRESS);

// Complete ABI matching your deployed contract
const PAYROLL_ABI = [
    // Core functions
    'function name() view returns (string)',
    'function initialize(address _companyOwner, address _taxRecipient, address _factory)',
    'function addEmployee(address wallet, address tokenAddress, uint256 salaryPerPeriod, uint8 frequency, uint64 customFrequency, uint16 taxBps)',
    'function processPayment(address employee)',
    'function forceProcessPayment(address employee)',
    'function removeEmployee(address employee)',
    'function deleteEmployeePermanently(address employee)',
    'function reactivateEmployee(address employee)',
    'function getEmployee(address _employee) view returns (address wallet, uint8 tokenType, address tokenAddress, uint256 salaryPerPeriod, uint8 frequency, uint64 customFrequency, uint64 nextPayTimestamp, uint16 taxBps, bool active, uint256 owed)',
    'function getEmployeeList() view returns (address[])',
    // Payment functions

    'function processPaymentWithHedge(address employee)',
    // Admin functions
    'function addAdmin(address who)',
    'function removeAdmin(address who)',
    'function toggleTax(bool enabled)',
    'function setTaxRecipient(address recipient)',
    // Hedge vault functions
    'function configureHedgeVault(address employee, uint8 riskLevel, uint256 volatilityThreshold, address volatileToken, address stableToken)',
    'function toggleHedgeVault(address employee, bool enabled)',
    'function updateHedgeVaultConfig(uint8 riskLevel, uint256 volatilityThreshold)',
    // Token addresses
    'function USDC_ADDRESS() view returns (address)',
    'function METH_ADDRESS() view returns (address)',
    // Emergency withdraw
    'function emergencyWithdraw(address token, uint256 amount) external',
];

// ============ DEPLOYMENT ============
export const deployCompanyPayroll = async (signer, companyDetails) => {
    let factory, provider, companyOwner;

    try {
        if (!FACTORY_ADDRESS || FACTORY_ADDRESS === ethers.constants.AddressZero) {
            throw new Error('Factory contract address not configured');
        }
        if (!signer) throw new Error('Signer required');

        provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);

        const code = await provider.getCode(FACTORY_ADDRESS);
        if (!code || code === '0x') {
            throw new Error(`No contract at FACTORY_ADDRESS ${FACTORY_ADDRESS}`);
        }

        factory = new ethers.Contract(FACTORY_ADDRESS, PayrollFactoryABI, signer);

        companyOwner = companyDetails.owner || companyDetails.companyOwner;
        if (!companyOwner || !ethers.utils.isAddress(companyOwner)) {
            throw new Error(`Invalid owner address: ${companyOwner}`);
        }

        const taxRecipient = companyDetails.taxRecipient || ethers.constants.AddressZero;

        console.log('Deploying payroll for:', companyOwner);
        console.log('Tax recipient:', taxRecipient);

        // First, make a static call to get the expected address from the deployment
        // (This doesn't actually deploy, just simulates what the return value would be)
        let expectedAddress = null;
        try {
            expectedAddress = await factory.callStatic.deployCompanyPayroll(companyOwner, taxRecipient);
            console.log('Expected address from static call:', expectedAddress);
        } catch (e) {
            console.warn('Static call failed to get address:', e);
        }

        // Deploy the new contract
        const tx = await factory.deployCompanyPayroll(companyOwner, taxRecipient);
        console.log('Tx sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Tx confirmed, receipt:', receipt);

        // The expected address from the static call should be the deployed contract
        if (expectedAddress && ethers.utils.isAddress(expectedAddress)) {
            // We expect the contract to be deployed at this address
            // Wait a moment to ensure the contract is fully deployed and indexed
            await new Promise(resolve => setTimeout(resolve, 2000));

            const code = await provider.getCode(expectedAddress);
            if (code !== '0x') {
                console.log('Verified deployed contract at expected address:', expectedAddress);
                return expectedAddress;
            } else {
                console.warn('Expected address from static call has no contract:', expectedAddress);
                // The contract might still be deploying, let's wait a bit more and try again
                await new Promise(resolve => setTimeout(resolve, 3000));
                const retryCode = await provider.getCode(expectedAddress);
                if (retryCode !== '0x') {
                    console.log('Verified deployed contract at expected address (after retry):', expectedAddress);
                    return expectedAddress;
                }
            }
        }

        // If static call didn't give us the right address, try to manually find the contract
        // Since the factory may not have getCompanyPayrolls function, we'll depend on the static call result

        // If we still can't find it, we could check if the factory has a more recent list
        // by comparing before and after the deployment, but that's complex.
        // Let's try one more approach - check the transaction receipt for potential contract creation

        if (receipt.logs && receipt.logs.length > 0) {
            console.log(`Processing ${receipt.logs.length} logs from transaction...`);
            for (const log of receipt.logs) {
                try {
                    // Check if the log is from a newly created contract
                    const contractCode = await provider.getCode(log.address);
                    if (contractCode !== '0x') {
                        // This could be the newly deployed payroll contract
                        try {
                            // Verify it's actually a payroll contract by checking for expected functions
                            const payroll = new ethers.Contract(log.address, PAYROLL_ABI, provider);
                            // Try to call a simple function to verify this is a payroll contract
                            const employeeList = await payroll.getEmployeeList();
                            console.log('Verified payroll contract deployed at:', log.address);
                            return log.address;
                        } catch (verifyErr) {
                            // Not a payroll contract, continue looking
                            console.log('Log address is not a payroll contract:', log.address);
                        }
                    }
                } catch (logErr) {
                    console.warn('Error processing log:', logErr);
                }
            }
        }

        throw new Error('Contract deployed but could not retrieve address. Please check the transaction on the block explorer.');

    } catch (error) {
        console.error('Deployment error:', error);

        if (error.code === 'CALL_EXCEPTION' || error.code === -32603) {
            throw new Error('Deployment failed - wallet may already have a contract deployed');
        }
        throw error;
    }
};

// ============ EMPLOYEE MANAGEMENT ============
export const addEmployee = async (payrollAddress, employeeData, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);

        // Determine token address
        let tokenAddress;
        switch (employeeData.currency) {
            case 'ETH':
                // Use mETH (mock volatile token) instead of native ETH for testing
                tokenAddress = '0x667E3c1507791e96A4AF670db14bE20c53267C2D';
                break;
            case 'mUSDC':
                tokenAddress = USDC_ADDRESS;
                break;
            case 'mETH':
                tokenAddress = '0x667E3c1507791e96A4AF670db14bE20c53267C2D';
                break;
            default:
                tokenAddress = USDC_ADDRESS;
        }

        // Parse salary - ensure it's a valid number
        const salaryStr = employeeData.salary.toString().trim();
        if (!salaryStr || isNaN(parseFloat(salaryStr))) {
            throw new Error('Invalid salary amount');
        }

        const salaryPerPeriod = ethers.utils.parseUnits(salaryStr, 18);

        // Determine frequency
        let frequency;
        switch (employeeData.paymentSchedule?.toLowerCase()) {
            case 'weekly': frequency = 0; break;
            case 'biweekly': frequency = 1; break;
            case 'monthly': frequency = 2; break;
            case 'hourly': frequency = 3; break;
            case 'minutely': frequency = 4; break;
            case 'custom': frequency = 5; break;
            default: frequency = 2;
        }

        const customFrequency = parseInt(employeeData.customFrequency) || 0;
        const taxBps = parseInt(employeeData.taxBps) || 0;

        console.log('Adding employee with params:', {
            wallet: employeeData.walletAddress,
            tokenAddress,
            salaryPerPeriod: salaryPerPeriod.toString(),
            frequency,
            customFrequency,
            taxBps
        });

        const tx = await payroll.addEmployee(
            employeeData.walletAddress,
            tokenAddress,
            salaryPerPeriod,
            frequency,
            customFrequency,
            taxBps
        );

        const receipt = await tx.wait();
        console.log('Employee added, tx:', receipt.transactionHash);
        // Persist employee name locally for UI display (since contract doesn't store name)
        if (employeeData.name) {
            localStorage.setItem(`employeeName:${employeeData.walletAddress}`, employeeData.name);
        }
        return true;
    } catch (error) {
        console.error('Error adding employee:', error);
        throw error;
    }
};

export const removeEmployee = async (payrollAddress, employeeAddress, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const tx = await payroll.removeEmployee(employeeAddress);
        await tx.wait();
        console.log('Employee removed:', employeeAddress);
        return true;
    } catch (error) {
        console.error('Error removing employee:', error);
        throw error;
    }
};

export const reactivateEmployee = async (payrollAddress, employeeAddress, signer) => {
    try {
        console.log('Creating contract instance for reactivate...');
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);

        console.log('Calling reactivateEmployee on contract...');
        const tx = await payroll.reactivateEmployee(employeeAddress);

        console.log('Transaction sent:', tx.hash);
        console.log('Waiting for confirmation...');

        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.transactionHash);
        console.log('Employee reactivated:', employeeAddress);
        return true;
    } catch (error) {
        console.error('Error reactivating employee:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Provide more specific error messages
        if (error.code === 4001) {
            throw new Error('Transaction rejected by user');
        } else if (error.code === 'CALL_EXCEPTION') {
            throw new Error('Contract call failed - employee may already be active or you may not have permission');
        } else if (error.message?.includes('employee already active')) {
            throw new Error('Employee is already active');
        }

        throw error;
    }
};


// ============ HEDGE VAULT CONFIGURATION ============
export const configureEmployeeHedgeVault = async (employeeAddress, riskLevel, volatilityThreshold, signer) => {
    try {
        console.log('Configuring hedge vault for employee:', employeeAddress);
        const mETHToken = SUPPORTED_TOKENS.find(t => t.symbol === 'mETH');
        if (!mETHToken) throw new Error('mETH token not found');
        const volatileTokenAddress = mETHToken.address;

        const HEDGE_VAULT_MANAGER_ABI = ['function initializeHedgeVault(address employee, address volatileToken, address stableToken, uint8 riskLevel, uint256 volatilityThreshold)'];
        const hedgeVaultManager = new ethers.Contract(HEDGE_VAULT_MANAGER_ADDRESS, HEDGE_VAULT_MANAGER_ABI, signer);

        let riskLevelEnum;
        switch (riskLevel.toUpperCase()) {
            case 'CONSERVATIVE': riskLevelEnum = 0; break;
            case 'MODERATE': riskLevelEnum = 1; break;
            case 'AGGRESSIVE': riskLevelEnum = 2; break;
            default: riskLevelEnum = 1;
        }

        const tx = await hedgeVaultManager.initializeHedgeVault(employeeAddress, volatileTokenAddress, USDC_ADDRESS, riskLevelEnum, volatilityThreshold);
        await tx.wait();
        console.log('Hedge vault configured successfully');
        return true;
    } catch (error) {
        console.error('Error configuring hedge vault:', error);
        throw error;
    }
};
export const deleteEmployeePermanently = async (payrollAddress, employeeAddress, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const tx = await payroll.deleteEmployeePermanently(employeeAddress);
        await tx.wait();
        console.log('Employee permanently deleted:', employeeAddress);
        return true;
    } catch (error) {
        console.error('Error deleting employee permanently:', error);
        throw error;
    }
};

export const getEmployee = async (payrollAddress, employeeAddress, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const data = await payroll.getEmployee(employeeAddress);

        // Contract returns 10 values (no advanceAuthorized in return)
        const salaryRaw = data[3] || data.salaryPerPeriod;
        const salaryFormatted = salaryRaw ? ethers.utils.formatUnits(salaryRaw, 18) : '0';

        return {
            wallet: data[0] || data.wallet,
            tokenType: Number(data[1] ?? data.tokenType ?? 0),
            tokenAddress: data[2] || data.tokenAddress,
            salaryPerPeriod: salaryFormatted,
            frequency: Number(data[4] ?? data.frequency ?? 2),
            customFrequency: Number(data[5] ?? data.customFrequency ?? 0),
            nextPayTimestamp: Number(data[6] ?? data.nextPayTimestamp ?? 0),
            taxBps: Number(data[7] ?? data.taxBps ?? 0),
            active: Boolean(data[8] ?? data.active ?? true),
            owed: ethers.utils.formatUnits(data[9] || data.owed || 0, 18),
            advanceAuthorized: false // Not returned by contract, default to false
        };
    } catch (error) {
        console.error('Error getting employee:', error);
        return null; // Return null instead of default to know if employee doesn't exist
    }
};

export const getEmployeeList = async (payrollAddress, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const list = await payroll.getEmployeeList();
        return list || [];
    } catch (error) {
        console.error('Error getting employee list:', error);
        return [];
    }
};

// ============ PAYMENTS ============
export const processPayment = async (payrollAddress, employeeAddress, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const tx = await payroll.processPaymentWithHedge(employeeAddress);
        await tx.wait();
        console.log('Payment processed for:', employeeAddress);
        return true;
    } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
    }
};

export const forceProcessPayment = async (payrollAddress, employeeAddress, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);

        // First try the actual forceProcessPayment function which should bypass time checks
        try {
            console.log('Attempting forceProcessPayment (bypasses time checks)...');
            const tx = await payroll.forceProcessPayment(employeeAddress);
            const receipt = await tx.wait();
            console.log('Force payment processed successfully for:', employeeAddress, 'Tx:', receipt.transactionHash);
            return true;
        } catch (forceErr) {
            console.warn('forceProcessPayment failed, trying processPaymentWithHedge (bypassing time check)...');

            // If forceProcessPayment doesn't exist or fails, try processPaymentWithHedge
            try {
                const tx = await payroll.processPaymentWithHedge(employeeAddress);
                const receipt = await tx.wait();
                console.log('Payment processed with hedge support for:', employeeAddress, 'Tx:', receipt.transactionHash);
                return true;
            } catch (hedgeErr) {
                console.warn('processPaymentWithHedge failed, error:', hedgeErr.message);

                // Last resort - try regular processPayment (but this will likely fail with timing)
                throw new Error(`All payment methods failed. Force error: ${forceErr.message}. Hedge error: ${hedgeErr.message}`);
            }
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
    }
};

// ============ HEDGE VAULT ============
// Set up hedge vault for an employee - this handles automatic risk management for their crypto salary
export const configureHedgeVault = async (payrollAddress, employeeAddress, hedgeConfig, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);

        // Convert risk level from string to enum number
        let riskLevel;
        switch (hedgeConfig.riskLevel?.toUpperCase()) {
            case 'CONSERVATIVE': riskLevel = 0; break; // Play it safe
            case 'MODERATE': riskLevel = 1; break;      // Balanced approach
            case 'AGGRESSIVE': riskLevel = 2; break;    // High risk, high reward
            default: riskLevel = 1;                      // Default to moderate if not specified
        }

        const tx = await payroll.configureHedgeVault(
            employeeAddress,
            riskLevel,
            hedgeConfig.volatilityThreshold || 500  // Default 5% threshold if not provided
        );
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error configuring hedge vault:', error);
        throw error;
    }
};

// ============ TAX MANAGEMENT ============
// Enable or disable the tax system
export const toggleTax = async (payrollAddress, enabled, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const tx = await payroll.toggleTax(enabled);
        await tx.wait();
        console.log(`Tax ${enabled ? 'enabled' : 'disabled'}`);
        return true;
    } catch (error) {
        console.error('Error toggling tax:', error);
        throw error;
    }
};

// Set the tax recipient address
export const setTaxRecipient = async (payrollAddress, recipientAddress, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const tx = await payroll.setTaxRecipient(recipientAddress);
        await tx.wait();
        console.log('Tax recipient updated:', recipientAddress);
        return true;
    } catch (error) {
        console.error('Error setting tax recipient:', error);
        throw error;
    }
};


// ============ ADVANCE ============
export const requestAdvance = async (payrollAddress, amount, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const formattedAmount = ethers.utils.parseUnits(amount.toString(), 18);
        const tx = await payroll.requestAdvance(formattedAmount);
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error requesting advance:', error);
        throw error;
    }
};

export const setAdvanceAuthorization = async (payrollAddress, employeeAddress, authorized, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const tx = await payroll.setAdvanceAuthorization(employeeAddress, authorized);
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error setting advance auth:', error);
        throw error;
    }
};

// ============ UTILITIES ============
export const getFactoryContract = async (signer) => {
    return new ethers.Contract(FACTORY_ADDRESS, PayrollFactoryABI, signer);
};

export const getPayrollContract = async (payrollAddress, signer) => {
    return new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
};

export const isContractOwner = async (payrollAddress, accountAddress, signer) => {
    try {
        const payroll = new ethers.Contract(payrollAddress, PAYROLL_ABI, signer);
        const owner = await payroll.companyOwner();
        return owner.toLowerCase() === accountAddress.toLowerCase();
    } catch (error) {
        console.error('Error checking owner:', error);
        return false;
    }
};

export const checkIfEmployee = async (payrollAddress, accountAddress, signer) => {
    try {
        const employees = await getEmployeeList(payrollAddress, signer);
        const isInList = employees.some(e => e.toLowerCase() === accountAddress.toLowerCase());

        if (isInList) {
            const empData = await getEmployee(payrollAddress, accountAddress, signer);
            return empData && empData.active;
        }
        return false;
    } catch (error) {
        console.error('Error checking if employee:', error);
        return false;
    }
};

export const getSupportedTokens = () => SUPPORTED_TOKENS;

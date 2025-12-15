require('dotenv').config();
const { ethers } = require('ethers');

// Configuration
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PAYROLL_CONTRACT_ADDRESS = process.env.PAYROLL_CONTRACT_ADDRESS;

// Minimal ABI for the functions we need
const PAYROLL_ABI = [
    'function getEmployeeList() external view returns (address[])',
    'function getEmployee(address _employee) external view returns (address wallet, uint8 tokenType, address tokenAddress, uint256 salaryPerPeriod, uint8 frequency, uint64 customFrequency, uint64 nextPayTimestamp, uint16 taxBps, bool active, uint256 owed)',
    'function processPayment(address employee) external',
    'function forceProcessPayment(address employee) external'
];

async function processPayments() {
    try {
        console.log('=== Starting Payment Automation ===');
        console.log(`RPC URL: ${RPC_URL}`);
        console.log(`Payroll Contract: ${PAYROLL_CONTRACT_ADDRESS}`);

        // Validate configuration
        if (!PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY not set in environment variables');
        }
        if (!PAYROLL_CONTRACT_ADDRESS) {
            throw new Error('PAYROLL_CONTRACT_ADDRESS not set in environment variables');
        }

        // Connect to blockchain
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const payrollContract = new ethers.Contract(PAYROLL_CONTRACT_ADDRESS, PAYROLL_ABI, wallet);

        console.log(`Connected as: ${wallet.address}`);

        // Get employee list
        const employeeList = await payrollContract.getEmployeeList();
        console.log(`Found ${employeeList.length} employees`);

        if (employeeList.length === 0) {
            console.log('No employees to process');
            return;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        let successCount = 0;
        let errorCount = 0;
        let notDueCount = 0;

        // Process each employee
        for (const employeeAddress of employeeList) {
            try {
                const employee = await payrollContract.getEmployee(employeeAddress);
                const [wallet, tokenType, tokenAddress, salaryPerPeriod, frequency, customFrequency, nextPayTimestamp, taxBps, active, owed] = employee;

                console.log(`\nChecking employee: ${employeeAddress}`);
                console.log(`  Active: ${active}`);
                console.log(`  Next payment: ${new Date(nextPayTimestamp * 1000).toLocaleString()}`);

                if (!active) {
                    console.log(`  ⏭️  Skipped (inactive)`);
                    continue;
                }

                if (currentTime < nextPayTimestamp) {
                    console.log(`  ⏰ Not due yet`);
                    notDueCount++;
                    continue;
                }

                // Payment is due
                console.log(`  💰 Processing payment...`);
                const tx = await payrollContract.processPayment(employeeAddress, {
                    gasLimit: 500000 // Set a reasonable gas limit
                });

                console.log(`  📤 Transaction sent: ${tx.hash}`);
                await tx.wait();
                console.log(`  ✅ Payment successful`);
                successCount++;

            } catch (error) {
                console.error(`  ❌ Error processing ${employeeAddress}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n=== Payment Run Complete ===');
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`⏰ Not Due: ${notDueCount}`);
        console.log(`⏭️  Skipped: ${employeeList.length - successCount - errorCount - notDueCount}`);

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run immediately if called directly
if (require.main === module) {
    processPayments()
        .then(() => {
            console.log('\n✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { processPayments };

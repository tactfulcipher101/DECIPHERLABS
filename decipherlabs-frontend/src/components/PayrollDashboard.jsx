import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, Plus, Users, Shield, TrendingUp, DollarSign, CheckCircle, Upload, Clock, Wallet, AlertCircle, RefreshCw, Trash2, Play, RotateCcw, UserX, Zap, Eye, Droplet } from 'lucide-react';
import { ethers } from 'ethers';
import FundingForm from './FundingForm';
import WithdrawForm from './WithdrawForm';
import { USDC_ADDRESS, getProviderAndSigner, SUPPORTED_TOKENS, formatAddress, formatTimestamp } from '../utils/web3';
import { deployCompanyPayroll, getFactoryContract, addEmployee, getEmployeeList, getEmployee, processPayment, removeEmployee, reactivateEmployee, forceProcessPayment, deleteEmployeePermanently, toggleTax, setTaxRecipient } from '../utils/payrollContract';
import { configureEmployeeHedgeVault } from '../utils/hedgeVault';

const PayrollDashboard = ({ account, setAccount, onNavigate, onDisconnect }) => {
  const [currentStep, setCurrentStep] = useState('loading');
  const [companyContract, setCompanyContract] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isEmployeeView, setIsEmployeeView] = useState(false);
  const [contractBalance, setContractBalance] = useState({ eth: '0', usdc: '0', meth: '0' });
  const [companyDetails, setCompanyDetails] = useState({
    name: '',
    taxRecipient: '',
    enableHedgeVault: false
  });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    walletAddress: '',
    salary: '',
    currency: 'mUSDC',
    paymentSchedule: 'monthly',
    taxBps: 0
  });
  const [companyList, setCompanyList] = useState([]);
  const [fundingAmount, setFundingAmount] = useState(''); // For mUSDC funding
  const [ethFundingAmount, setEthFundingAmount] = useState(''); // For ETH funding

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deploymentStatus, setDeploymentStatus] = useState('idle');
  const [taxSettings, setTaxSettings] = useState({
    enabled: false,
    recipientAddress: ''
  });
  const [selectedEmployeeForHedge, setSelectedEmployeeForHedge] = useState('');
  const [hedgeVaultConfig, setHedgeVaultConfig] = useState({
    riskLevel: 'MODERATE',
    volatilityThreshold: 500
  });
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: '' });

  // Known test payroll
  const KNOWN_TEST_PAYROLL = '0x44E9c30EE6C7b9f4c7c53A4D5FCaa3BB99A14Cf2';
  const TEST_OWNER = '0xBea138f19224adB24958DB663fc4830b276fdF9B';

  // Employee name helpers
  const saveEmployeeName = (address, name) => {
    if (name && address) {
      const key = `employeeName:${address.toLowerCase()}`;
      localStorage.setItem(key, name);
    }
  };

  const getEmployeeName = (address) => {
    if (!address) return '';
    const key = `employeeName:${address.toLowerCase()}`;
    return localStorage.getItem(key) || '';
  };

  const getEmployeeDisplayName = (address, name = null) => {
    const savedName = name || getEmployeeName(address);
    if (savedName) {
      return `${savedName} (${formatAddress(address)})`;
    }
    return formatAddress(address);
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError('');
      localStorage.setItem('preferredPage', 'payroll');
      const web3Utils = await import('../utils/web3');
      const { address } = await web3Utils.connectWallet();
      setAccount(address);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      checkForExistingContract();
    } else {
      setCompanyContract(null);
      setCurrentStep('loading');
      setEmployees([]);
    }
  }, [account]);

  // Clear errors when changing steps
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [currentStep]);

  // Load contract data when contract is set
  useEffect(() => {
    if (companyContract && currentStep === 'dashboard') {
      loadContractData();
    }
  }, [companyContract, currentStep]);

  // Show employee portal option if connected wallet is an employee
  useEffect(() => {
    if (account && employees.length > 0) {
      const isEmp = employees.some(e => e.address.toLowerCase() === account.toLowerCase());
      setIsEmployeeView(isEmp);
    } else {
      setIsEmployeeView(false);
    }
  }, [account, employees]);

  const checkForExistingContract = async () => {
    if (!account) return;
    setCurrentStep('loading');

    try {
      const { provider, signer } = await getProviderAndSigner();

      // 1. Check Factory Contract (Source of Truth)
      try {
        const factoryContract = await getFactoryContract(signer);
        if (factoryContract.getCompanyPayrolls) {
          const payrolls = await factoryContract.getCompanyPayrolls(account);
          console.log('Factory payrolls for account:', payrolls);

          if (payrolls && payrolls.length > 0) {
            // Fetch names for all contracts
            const list = await Promise.all(
              payrolls.map(async (addr) => {
                let name = localStorage.getItem(`companyName:${addr}`);
                if (!name) {
                  try {
                    // Try fetching name from contract
                    const c = new ethers.Contract(addr, ['function name() view returns (string)'], provider);
                    name = await c.name();
                    if (name) localStorage.setItem(`companyName:${addr}`, name);
                  } catch (e) {
                    console.warn(`Could not get name for ${addr}`, e);
                  }
                }
                return { address: addr, name: name || 'Unnamed Company' };
              })
            );

            // Sort by most recent (assuming last in list is newest)
            setCompanyList(list.reverse());
            setCurrentStep('selectCompany');
            return;
          }
        }
      } catch (e) {
        console.error('Error checking factory contract:', e);
      }

      // 2. Fallback: Check localStorage (Legacy/Local only)
      const storedContract = localStorage.getItem(`companyContract:${account}`);
      if (storedContract) {
        const code = await provider.getCode(storedContract);
        if (code && code !== '0x') {
          // If we found one locally but Factory failed/didn't have it, offer it
          setCompanyList([{ address: storedContract, name: localStorage.getItem(`companyName:${storedContract}`) || 'Local Contract' }]);
          setCurrentStep('selectCompany');
          return;
        }
        localStorage.removeItem(`companyContract:${account}`);
      }

      // 3. Check for Employee Status (Test Contract)
      try {
        const code = await provider.getCode(KNOWN_TEST_PAYROLL);
        if (code && code !== '0x') {
          const employeeCheckPromise = getEmployeeList(KNOWN_TEST_PAYROLL, signer);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Employee check timeout')), 3000)
          );

          try {
            const employeeList = await Promise.race([employeeCheckPromise, timeoutPromise]);
            const isEmployee = employeeList.some(addr => addr.toLowerCase() === account.toLowerCase());

            if (isEmployee) {
              const goToPortal = window.confirm(
                `You are registered as an employee in the demo contract!\n\n` +
                `Click OK to view your Employee Portal\n` +
                `Click Cancel to deploy your own company contract`
              );

              if (goToPortal) {
                onNavigate('employee', {
                  employeeAddress: account,
                  companyContract: KNOWN_TEST_PAYROLL
                });
                return;
              }
            }
          } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }

      setCurrentStep('setup');
    } catch (err) {
      console.error('Error checking contracts:', err);
      setCurrentStep('setup');
    }
  };

  const loadContractData = async () => {
    if (!companyContract) return;

    // Load company name from localStorage
    const savedName = localStorage.getItem(`companyName:${companyContract}`);
    if (savedName) {
      setCompanyDetails(prev => ({ ...prev, name: savedName }));
    }

    try {
      const { provider, signer } = await getProviderAndSigner();

      // Get ETH balance
      const ethBalance = await provider.getBalance(companyContract);

      // Get mUSDC balance
      let usdcBalance = '0';
      try {
        const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
        const usdcContract = new ethers.Contract(USDC_ADDRESS, erc20Abi, provider);
        const balance = await usdcContract.balanceOf(companyContract);
        usdcBalance = ethers.utils.formatUnits(balance, 18);
        console.log('[Balance] mUSDC:', usdcBalance, 'Address:', USDC_ADDRESS);
      } catch (e) {
        console.error('[Balance] Error loading mUSDC:', e);
      }

      // Get mETH balance
      let methBalance = '0';
      try {
        // Use mETH address from SUPPORTED_TOKENS
        const methToken = SUPPORTED_TOKENS['mETH'];
        if (methToken) {
          const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
          const methContract = new ethers.Contract(methToken.address, erc20Abi, provider);
          const balance = await methContract.balanceOf(companyContract);
          methBalance = ethers.utils.formatUnits(balance, 18);
          console.log('[Balance] mETH:', methBalance, 'Address:', methToken.address);
        } else {
          console.warn('mETH token not found in SUPPORTED_TOKENS');
        }
      } catch (e) {
        console.error('[Balance] Error loading mETH:', e);
      }

      setContractBalance({
        eth: ethers.utils.formatEther(ethBalance),
        usdc: usdcBalance,
        meth: methBalance
      });

      // Get employees
      try {
        const employeeAddresses = await getEmployeeList(companyContract, signer);
        const employeeData = await Promise.all(
          employeeAddresses.map(async (addr) => {
            const data = await getEmployee(companyContract, addr, signer);
            const name = getEmployeeName(addr); // Load name from localStorage
            return { address: addr, name, ...data };
          })
        );
        setEmployees(employeeData);

        setEmployees(employeeData);

        // Check if connected account is an employee
        if (account) {
          const isEmployee = employeeData.some(emp =>
            emp.address.toLowerCase() === account.toLowerCase() && emp.active
          );
          setIsEmployeeView(isEmployee);
        }
      } catch (e) {
        console.warn('Could not load employees:', e.message);
      }
    } catch (err) {
      console.error('Error loading contract data:', err);
    }
  };

  const handleCompanySetup = async () => {
    if (!companyDetails.name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setDeploymentStatus('deploying');
      setError('');

      const { signer } = await getProviderAndSigner();
      const deployConfig = {
        owner: account,
        taxRecipient: companyDetails.taxRecipient || ethers.constants.AddressZero,
        name: companyDetails.name.trim(),
        enableHedgeVault: companyDetails.enableHedgeVault
      };

      const contractAddress = await deployCompanyPayroll(signer, deployConfig);
      setCompanyContract(contractAddress);
      localStorage.setItem(`companyContract:${account}`, contractAddress);
      localStorage.setItem(`companyName:${contractAddress}`, companyDetails.name.trim());
      setDeploymentStatus('success');
      setSuccess(`Contract deployed at ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`);

      setTimeout(() => {
        setCurrentStep('dashboard');
        setDeploymentStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Deployment error:', err);
      setDeploymentStatus('error');
      if (err.code === 'CALL_EXCEPTION') {
        setError('You may already have a deployed contract. Checking...');
        setTimeout(() => checkForExistingContract(), 1000);
      } else {
        setError(err.message || 'Deployment failed');
      }
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.walletAddress || !newEmployee.salary) {
      setError('Wallet address and salary are required');
      return;
    }

    if (!ethers.utils.isAddress(newEmployee.walletAddress)) {
      setError('Invalid wallet address');
      return;
    }

    try {
      setActionLoading('addEmployee');
      setError('');

      const { signer } = await getProviderAndSigner();

      // Convert tax percentage to basis points
      const employeeData = {
        ...newEmployee,
        taxBps: Math.round(newEmployee.taxBps * 100)
      };

      await addEmployee(companyContract, employeeData, signer);

      // Save employee name
      if (newEmployee.name) {
        saveEmployeeName(newEmployee.walletAddress, newEmployee.name);
      }

      setSuccess(`Employee added successfully!`);
      setNewEmployee({ name: '', walletAddress: '', salary: '', currency: 'mUSDC', paymentSchedule: 'monthly', taxBps: 0 });
      await loadContractData();
      setCurrentStep('employees');
    } catch (err) {
      console.error('Error adding employee:', err);
      setError(err.message || 'Failed to add employee');
    } finally {
      setActionLoading('');
    }
  };

  const handleProcessPayment = async (employeeAddress) => {
    try {
      setActionLoading(`pay-${employeeAddress}`);
      setError(''); // Clear global error

      const { signer } = await getProviderAndSigner();

      // Try forceProcessPayment first (immediate payment)
      try {
        await forceProcessPayment(companyContract, employeeAddress, signer);
        setSuccess('Payment processed successfully!');
        await loadContractData();
      } catch (forceErr) {
        // If forceProcessPayment fails, show inline error
        console.warn('Payment not processed:', forceErr.message);
        throw forceErr;
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      // Extract clean error message
      let errorMessage = 'Payment failed';

      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.error && err.error.message) {
        errorMessage = err.error.message;
      } else if (err.message) {
        // Extract "execution reverted: not due"
        const match = err.message.match(/execution reverted: (.+?)(?:"|$)/);
        if (match) {
          errorMessage = match[1];
        } else {
          errorMessage = err.message.split('(')[0].trim();
        }
      }

      // User-friendly "not due" message
      if (errorMessage === 'not due' || errorMessage.includes('not due')) {
        errorMessage = 'Payment not due yet. Please wait until the scheduled payment date.';
      }

      // Show error inline
      setError(`${employeeAddress}: ${errorMessage}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleRemoveEmployee = async (employeeAddress) => {
    if (!window.confirm(`Are you sure you want to deactivate employee ${employeeAddress}? They will be marked as inactive but can be reactivated later.`)) {
      return;
    }

    try {
      setActionLoading(`remove-${employeeAddress}`);
      setError('');

      const { signer } = await getProviderAndSigner();
      await removeEmployee(companyContract, employeeAddress, signer);

      setSuccess('Employee deactivated successfully!');
      await loadContractData(); // Refresh employee list
    } catch (err) {
      console.error('Error removing employee:', err);
      setError(err.message || 'Failed to deactivate employee');
    } finally {
      setActionLoading('');
    }
  };
  const handleConfigureHedgeVault = async () => {
    if (!selectedEmployeeForHedge) {
      setError('Please select an employee');
      return;
    }

    try {
      setActionLoading('configure-hedge');
      setError('');

      const { signer } = await getProviderAndSigner();

      await configureEmployeeHedgeVault(
        companyContract,
        selectedEmployeeForHedge,
        hedgeVaultConfig.riskLevel,
        hedgeVaultConfig.volatilityThreshold,
        signer
      );

      setSuccess(`Hedge vault configured successfully for ${selectedEmployeeForHedge.slice(0, 6)}...${selectedEmployeeForHedge.slice(-4)}!`);
      await loadContractData();
    } catch (err) {
      console.error('Error configuring hedge vault:', err);
      setError(err.message || 'Failed to configure hedge vault');
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteEmployee = async (employeeAddress) => {
    if (!window.confirm(`⚠️ PERMANENT DELETE: Are you sure you want to permanently delete employee ${employeeAddress}? This action CANNOT be undone!`)) {
      return;
    }

    try {
      setActionLoading(`delete-${employeeAddress}`);
      setError('');

      const { signer } = await getProviderAndSigner();
      await deleteEmployeePermanently(companyContract, employeeAddress, signer);

      setSuccess('Employee permanently deleted!');
      await loadContractData(); // Refresh employee list
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError(err.message || 'Failed to delete employee');
    } finally {
      setActionLoading('');
    }
  };

  // Settings Handlers


  const handleToggleTax = async (enabled) => {
    try {
      setActionLoading('toggle-tax');
      setError('');

      const { signer } = await getProviderAndSigner();
      await toggleTax(companyContract, enabled, signer);

      setTaxSettings({ ...taxSettings, enabled });
      setSuccess(`Tax system ${enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (err) {
      console.error('Error toggling tax:', err);
      setError(err.message || 'Failed to toggle tax');
    } finally {
      setActionLoading('');
    }
  };

  const handleSetTaxRecipient = async () => {
    if (!ethers.utils.isAddress(taxSettings.recipientAddress)) {
      setError('Invalid tax recipient address');
      return;
    }

    try {
      setActionLoading('set-tax-recipient');
      setError('');

      const { signer } = await getProviderAndSigner();
      await setTaxRecipient(companyContract, taxSettings.recipientAddress, signer);

      setSuccess('Tax recipient updated successfully!');
    } catch (err) {
      console.error('Error setting tax recipient:', err);
      setError(err.message || 'Failed to set tax recipient');
    } finally {
      setActionLoading('');
    }
  };

  // CSV Bulk Upload Handlers
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);



      // Skip header
      const dataRows = rows.slice(1);

      const parsed = dataRows.map((row, index) => {
        const columns = row.split(',').map(col => col.trim());
        return {
          lineNumber: index + 2, // +2 for header and 0-index
          name: columns[0] || '',
          walletAddress: columns[1] || '',
          salary: columns[2] || '',
          currency: columns[3] || 'mUSDC',
          paymentSchedule: columns[4] || 'monthly',
          taxBps: parseFloat(columns[5]) || 0,
          valid: true,
          error: ''
        };
      });

      // Validate rows
      parsed.forEach(row => {
        if (!row.walletAddress) {
          row.valid = false;
          row.error = 'Missing wallet address';
        } else if (!ethers.utils.isAddress(row.walletAddress)) {
          row.valid = false;
          row.error = 'Invalid wallet address';
        } else if (!row.salary || isNaN(parseFloat(row.salary))) {
          row.valid = false;
          row.error = 'Invalid salary';
        } else if (row.taxBps < 0 || row.taxBps > 100) {
          row.valid = false;
          row.error = 'Tax must be between 0-100%';
        }
      });

      setCsvData(parsed);
      setCsvFile(file);
    };

    reader.readAsText(file);
  };

  const handleBulkAddEmployees = async () => {
    const validRows = csvData.filter(row => row.valid);

    if (validRows.length === 0) {
      setError('No valid employees to add');
      return;
    }

    try {
      setActionLoading('bulk-add');
      setError('');
      setUploadProgress({ current: 0, total: validRows.length, status: 'Starting...' });

      const { signer } = await getProviderAndSigner();
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        setUploadProgress({
          current: i + 1,
          total: validRows.length,
          status: `Adding ${row.name || formatAddress(row.walletAddress)}...`
        });

        try {
          const employeeData = {
            name: row.name,
            walletAddress: row.walletAddress,
            salary: row.salary,
            currency: row.currency,
            paymentSchedule: row.paymentSchedule,
            taxBps: Math.round(row.taxBps * 100) // Percentage to basis points
          };

          await addEmployee(companyContract, employeeData, signer);

          // Save employee name
          if (row.name) {
            saveEmployeeName(row.walletAddress, row.name);
          }

          successCount++;
        } catch (err) {
          console.error(`Failed to add employee at line ${row.lineNumber}:`, err);
          failCount++;
        }
      }

      setSuccess(`Successfully added ${successCount} employee(s)${failCount > 0 ? `, ${failCount} failed` : ''}!`);
      setCsvData([]);
      setCsvFile(null);
      await loadContractData();
    } catch (err) {
      console.error('Bulk add error:', err);
      setError(err.message || 'Failed to add employees');
    } finally {
      setActionLoading('');
      setUploadProgress({ current: 0, total: 0, status: '' });
    }
  };

  // Process payments for active employees
  const handleProcessAllPayments = async () => {
    if (!window.confirm(`Are you sure you want to process payments for all ${employees.filter(e => e.active).length} active employees? \n\nNOTE: This will require approving ${employees.filter(e => e.active).length} separate transactions in your wallet.`)) {
      return;
    }

    try {
      setActionLoading('batch-pay');
      setError('');

      const { signer } = await getProviderAndSigner();
      const activeEmployees = employees.filter(emp => emp.active);

      if (activeEmployees.length === 0) {
        setError('No active employees to pay');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const emp of activeEmployees) {
        try {
          // Try force process payment, fallback to regular
          try {
            await forceProcessPayment(companyContract, emp.address, signer);
          } catch (forceErr) {
            console.warn(`forceProcessPayment failed for ${emp.address}, trying alternative:`, forceErr);
            // Immediate payment requires force function
            throw new Error('Batch payment requires the forceProcessPayment function which is not available in the deployed contract.');
          }
          successCount++;
        } catch (err) {
          console.error(`Error processing payment for ${emp.address}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully processed payments for ${successCount} employee(s).${errorCount > 0 ? ` ${errorCount} failed.` : ''}`);
      } else if (errorCount > 0) {
        setError(`Failed to process payments for all employees. ${errorCount} error(s).`);
      }

      await loadContractData(); // Refresh data
    } catch (err) {
      console.error('Error processing all payments:', err);
      setError(err.message || 'Failed to process all payments');
    } finally {
      setActionLoading('');
    }
  };

  // Reactivate employee
  const handleReactivateEmployee = async (employeeAddress) => {
    try {
      setActionLoading(`reactivate-${employeeAddress}`);
      setError('');

      console.log('Reactivating employee:', employeeAddress);
      console.log('Company contract:', companyContract);

      const { signer } = await getProviderAndSigner();
      console.log('Got signer, calling reactivateEmployee...');

      await reactivateEmployee(companyContract, employeeAddress, signer);

      setSuccess('Employee reactivated successfully!');
      await loadContractData(); // Refresh employee list
    } catch (err) {
      console.error('Error reactivating employee:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        data: err.data
      });
      setError(err.message || 'Failed to reactivate employee');
    } finally {
      setActionLoading('');
    }
  };



  const handleFundContract = async (token = 'ETH') => {
    const amountToUse = token === 'ETH' ? ethFundingAmount : fundingAmount;

    if (!amountToUse || parseFloat(amountToUse) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setActionLoading(`fund-${token}`);
      setError('');

      const { signer } = await getProviderAndSigner();
      const amount = token === 'ETH'
        ? ethers.utils.parseEther(amountToUse.toString())
        : ethers.utils.parseUnits(amountToUse.toString(), 18); // mUSDC uses 18 decimals like ETH

      if (token === 'ETH') {
        // Call fundWithETH()
        const payrollAbi = ['function fundWithETH() external payable'];
        const payrollContract = new ethers.Contract(companyContract, payrollAbi, signer);

        console.log('Funding contract with ETH:', amountToUse);
        const tx = await payrollContract.fundWithETH({ value: amount });
        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        console.log('Transaction confirmed');
      } else {
        // ERC20 transfer
        const erc20Abi = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function approve(address spender, uint256 amount) returns (bool)'
        ];
        const tokenContract = new ethers.Contract(USDC_ADDRESS, erc20Abi, signer);
        const tx = await tokenContract.transfer(companyContract, amount);
        await tx.wait();
      }

      setSuccess(`Successfully funded ${amountToUse} ${token}!`);
      if (token === 'ETH') {
        setEthFundingAmount('');
      } else {
        setFundingAmount('');
      }
      await loadContractData();
    } catch (err) {
      console.error('Error funding contract:', err);
      setError(err.message || 'Failed to fund contract');
    } finally {
      setActionLoading('');
    }
  };

  // Render functions
  const renderLoading = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-300">Checking for existing payroll contract...</p>
      </div>
    </div>
  );

  const renderSelectCompany = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Company</h2>
        <p className="text-slate-400">We found {companyList.length} company contract{companyList.length !== 1 ? 's' : ''} associated with your wallet.</p>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-xl border border-blue-500/20 max-h-[60vh] overflow-y-auto mb-6">
        <div className="space-y-3">
          {companyList.map((company, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCompanyContract(company.address);
                localStorage.setItem(`companyContract:${account}`, company.address);
                localStorage.setItem(`companyName:${company.address}`, company.name);
                setCurrentStep('dashboard');
              }}
              className="w-full text-left p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">{company.name}</h3>
                  <p className="text-slate-500 text-xs font-mono mt-1">{company.address}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-blue-500/20">
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-400 rotate-180" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-slate-500 text-sm mb-4">Want to create a new company?</p>
        <button
          onClick={() => setCurrentStep('setup')}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm font-medium transition-colors border border-slate-700"
        >
          Deploy New Company
        </button>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Company Setup</h2>
      <p className="text-slate-400 mb-8">Deploy your company's payroll smart contract.</p>

      <div className="space-y-6 bg-slate-900/50 p-6 rounded-xl border border-blue-500/20">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Company Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={companyDetails.name}
            onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            placeholder="Enter company name"
            disabled={deploymentStatus === 'deploying'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Admin Wallet</label>
          <div className="w-full px-3 py-2 bg-slate-800/30 border border-slate-700 rounded-lg text-slate-400 font-mono text-sm">{account}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tax Recipient (Optional)</label>
          <input
            type="text"
            value={companyDetails.taxRecipient}
            onChange={(e) => setCompanyDetails({ ...companyDetails, taxRecipient: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            placeholder="0x..."
            disabled={deploymentStatus === 'deploying'}
          />
        </div>

        <div className="border-t border-slate-700 pt-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="enableHedgeVault"
              checked={companyDetails.enableHedgeVault}
              onChange={(e) => setCompanyDetails({ ...companyDetails, enableHedgeVault: e.target.checked })}
              className="mt-1 rounded border-slate-700 text-blue-500"
              disabled={deploymentStatus === 'deploying'}
            />
            <label htmlFor="enableHedgeVault" className="text-slate-300 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="font-medium">Volatility Hedge Vaults</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">MVP</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">Automatic risk management for crypto salaries</p>
            </label>
          </div>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}

        {deploymentStatus === 'success' && (
          <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Contract Deployed!</p>
                <p className="text-slate-400 text-xs mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        )}

        {deploymentStatus !== 'success' && (
          <button
            onClick={handleCompanySetup}
            disabled={deploymentStatus === 'deploying'}
            className={`w-full py-3 rounded-lg text-white font-medium transition-all ${deploymentStatus === 'deploying' ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              }`}
          >
            {deploymentStatus === 'deploying' ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deploying...</span>
              </span>
            ) : 'Deploy Contract'}
          </button>
        )}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      {/* Employee Portal Banner */}
      {isEmployeeView && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="text-white font-semibold">You're an Employee!</h3>
                <p className="text-slate-300 text-sm">Your wallet is registered as an employee in this company</p>
              </div>
            </div>
            <button
              onClick={() => {
                setError('');
                setSuccess('');
                setCurrentStep('funding');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Funding</span>
            </button>
            <button
              onClick={() => {
                setError('');
                setSuccess('');
                setCurrentStep('withdraw');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Withdraw Funds</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Company Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Manage payroll and employees</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={loadContractData} className="p-2 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          {companyList.length > 0 ? (
            <button
              onClick={() => setCurrentStep('selectCompany')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white hover:text-blue-300 transition-colors text-sm flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Switch / New</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep('setup')}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-colors text-sm"
              title="Deploy a new payroll contract"
            >
              Deploy New Contract
            </button>
          )}
          <div className="px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400">Contract: </span>
            <span className="text-sm text-white font-mono">{companyContract?.slice(0, 6)}...{companyContract?.slice(-4)}</span>
          </div>
        </div>
      </div>

      {/* Funding section */}
      {currentStep === 'funding' && (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setCurrentStep('dashboard')} className="mb-6 flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Fund Contract</h2>
              <p className="text-slate-400 mb-6">Add funds to your payroll contract. A 1% service fee will be automatically deducted.</p>

              {success && (
                <div className="mb-6 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {!companyContract ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading contract...</p>
                </div>
              ) : (
                <FundingForm
                  companyContract={companyContract}
                  onSuccess={() => {
                    setSuccess('Funds added successfully! 1% service fee has been sent to DeCipherLabs treasury.');
                    loadContractData();
                  }}
                  onError={(err) => setError(err)}
                  setActionLoading={setActionLoading}
                  actionLoading={actionLoading}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdraw section */}
      {currentStep === 'withdraw' && companyContract && (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-6">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setCurrentStep('dashboard')} className="mb-6 flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Withdraw Funds</h2>
              <p className="text-slate-400 mb-6">Withdraw excess funds from your payroll contract.</p>

              {success && (
                <div className="mb-6 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <WithdrawForm
                companyContract={companyContract}
                contractBalance={contractBalance}
                onSuccess={() => {
                  setSuccess('Funds withdrawn successfully!');
                  loadContractData();
                }}
                onError={(err) => setError(err)}
                setActionLoading={setActionLoading}
                actionLoading={actionLoading}
              />
            </div>
          </div>
        </div>
      )}


      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setError('');
            setSuccess('');
            loadContractData();
          }}
          disabled={actionLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Balances</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">ETH Balance</p>
          <p className="text-2xl font-bold text-white">{parseFloat(contractBalance.eth).toFixed(4)}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">mUSDC Balance</p>
          <p className="text-2xl font-bold text-white">{parseFloat(contractBalance.usdc).toFixed(2)}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">Employees</p>
          <p className="text-2xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">mETH Balance</p>
          <p className="text-2xl font-bold text-white">{parseFloat(contractBalance.meth).toFixed(4)}</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button onClick={() => setCurrentStep('funding')} className="p-6 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl transition-colors text-left group">
          <div className="flex items-center space-x-3 mb-3">
            <DollarSign className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-white">Funding</h3>
          </div>
          <p className="text-slate-400 text-sm">Add funds to pay salaries</p>
        </button>

        <button onClick={() => setCurrentStep('employees')} className="p-6 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl transition-colors text-left group">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-white">Employees</h3>
          </div>
          <p className="text-slate-400 text-sm">Manage team ({employees.length})</p>
        </button>

        <button onClick={() => setCurrentStep('payments')} className="p-6 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl transition-colors text-left group">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-white">Payments</h3>
          </div>
          <p className="text-slate-400 text-sm">Process salary payments</p>
        </button>

        <button onClick={() => setCurrentStep('settings')} className="p-6 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 rounded-xl transition-colors text-left group">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-white">Settings</h3>
          </div>
          <p className="text-slate-400 text-sm">Configure tax and hedge vault</p>
        </button>

        <button onClick={() => onNavigate && onNavigate('faucet')} className="p-6 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl transition-colors text-left group">
          <div className="flex items-center space-x-3 mb-3">
            <Droplet className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-white">Test Faucet</h3>
          </div>
          <p className="text-slate-400 text-sm">Get free test tokens</p>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button onClick={() => setCurrentStep('addEmployee')} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white flex items-center space-x-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
        <button onClick={() => setCurrentStep('funding')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors">
          Fund Contract
        </button>
        <button
          onClick={() => onNavigate && onNavigate('faucet')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white flex items-center space-x-2 transition-colors"
        >
          <Droplet className="w-4 h-4" />
          <span>Get Test Tokens</span>
        </button>
      </div>
    </div>
  );

  const renderEmployeeManagement = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Employees ({employees.length})</h2>
        <button onClick={() => setCurrentStep('dashboard')} className="text-slate-400 hover:text-white flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-xl border border-blue-500/20">
        <div className="flex flex-wrap gap-4 mb-6">
          <button onClick={() => setCurrentStep('addEmployee')} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white flex items-center space-x-2">
            <Plus className="w-4 h-4" /><span>Add Employee</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No employees yet</td></tr>
              ) : (
                employees.map((emp, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-slate-800/50 transition-all ${!emp.active
                      ? 'opacity-40 bg-red-950/10 hover:opacity-60'
                      : 'hover:bg-slate-800/30'
                      }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        {emp.name && (
                          <span className="text-white font-medium">{emp.name}</span>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-400 text-sm">{emp.address?.slice(0, 6)}...{emp.address?.slice(-4)}</span>
                          {!emp.active && (
                            <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded font-semibold">INACTIVE</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${!emp.active ? 'text-slate-500 line-through' : 'text-green-400'
                      }`}>
                      {parseFloat(emp.salaryPerPeriod || 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 ${!emp.active ? 'text-slate-600' : 'text-slate-300'}`}>
                      {['Weekly', 'Biweekly', 'Monthly', 'Hourly', 'Minutely', 'Custom'][emp.frequency] || 'Monthly'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${emp.active
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-slate-700/50 border border-slate-600 text-slate-400'
                        }`}>
                        {emp.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {emp.active ? (
                          <>
                            <button
                              onClick={() => handleProcessPayment(emp.address)}
                              disabled={actionLoading === `pay-${emp.address}`}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded text-white text-xs font-medium disabled:opacity-50 flex items-center space-x-1 transition-all"
                              title="Force Pay Now"
                            >
                              {actionLoading === `pay-${emp.address}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Zap className="w-3 h-3" />
                                  <span>Pay Now</span>
                                </>
                              )}
                            </button>
                            {/* Show inline error for this specific employee */}
                            {error && error.startsWith(emp.address) && (
                              <div className="col-span-5 px-4 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-400 text-xs">
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                {error.replace(`${emp.address}: `, '')}
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveEmployee(emp.address)}
                              disabled={actionLoading === `remove-${emp.address}`}
                              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-white text-xs disabled:opacity-50 transition-all"
                              title="Deactivate Employee"
                            >
                              {actionLoading === `remove-${emp.address}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserX className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.address)}
                              disabled={actionLoading === `delete-${emp.address}`}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-white text-xs disabled:opacity-50 transition-all"
                              title="Permanently Delete"
                            >
                              {actionLoading === `delete-${emp.address}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleReactivateEmployee(emp.address)}
                              disabled={actionLoading === `reactivate-${emp.address}`}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-white text-xs disabled:opacity-50 flex items-center space-x-1 transition-all"
                              title="Reactivate Employee"
                            >
                              {actionLoading === `reactivate-${emp.address}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reactivate</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.address)}
                              disabled={actionLoading === `delete-${emp.address}`}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-white text-xs disabled:opacity-50 transition-all"
                              title="Permanently Delete"
                            >
                              {actionLoading === `delete-${emp.address}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAddEmployee = () => (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Add Employee</h2>
        <button onClick={() => setCurrentStep('employees')} className="text-slate-400 hover:text-white flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}

      <div className="bg-slate-900/50 p-6 rounded-xl border border-blue-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Employee Name</label>
            <input
              type="text"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="John Doe"
            />
            <p className="text-xs text-slate-500 mt-1">Optional - for display purposes only</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Wallet Address *</label>
            <input
              type="text"
              value={newEmployee.walletAddress}
              onChange={(e) => setNewEmployee({ ...newEmployee, walletAddress: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Salary *</label>
            <input
              type="number"
              value={newEmployee.salary}
              onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Token</label>
            <select
              value={newEmployee.currency}
              onChange={(e) => setNewEmployee({ ...newEmployee, currency: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="mUSDC" className="bg-slate-800 text-white">mUSDC (Mock Stablecoin)</option>
              <option value="mETH" className="bg-slate-800 text-white">mETH (Mock Volatile)</option>
              <option value="ETH" className="bg-slate-800 text-white">ETH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Payment Schedule</label>
            <select
              value={newEmployee.paymentSchedule}
              onChange={(e) => setNewEmployee({ ...newEmployee, paymentSchedule: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="minutely" className="bg-slate-800 text-white">Every Minute (Testing)</option>
              <option value="hourly" className="bg-slate-800 text-white">Hourly (Testing)</option>
              <option value="weekly" className="bg-slate-800 text-white">Weekly</option>
              <option value="biweekly" className="bg-slate-800 text-white">Bi-weekly</option>
              <option value="monthly" className="bg-slate-800 text-white">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tax (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={newEmployee.taxBps}
              onChange={(e) => setNewEmployee({ ...newEmployee, taxBps: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g., 7 for 7%"
            />
            <p className="text-xs text-slate-500 mt-1">Enter as percentage (e.g., 7 = 7%)</p>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button onClick={() => setCurrentStep('employees')} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white">Cancel</button>
          <button
            onClick={handleAddEmployee}
            disabled={actionLoading === 'addEmployee'}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white disabled:opacity-50"
          >
            {actionLoading === 'addEmployee' ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </div>

      {/* CSV Bulk Upload Section */}
      <div className="mt-8 pt-8 border-t border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Bulk Upload via CSV</h3>
        <p className="text-slate-400 text-sm mb-4">
          Upload a CSV file to add multiple employees at once
        </p>

        {/* CSV Format Guide */}
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm font-medium mb-2">CSV Format:</p>
          <code className="text-xs text-slate-300 block">
            Name,Wallet Address,Salary,Token,Schedule,Tax%<br />
            John Doe,0x123...,5000,mUSDC,monthly,7<br />
            Jane Smith,0x456...,6000,mUSDC,biweekly,5
          </code>
        </div>

        {/* File Input */}
        <div className="mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-500
              file:cursor-pointer cursor-pointer"
          />
        </div>

        {/* CSV Preview */}
        {csvData.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white font-medium mb-2">
              Preview ({csvData.filter(r => r.valid).length} valid, {csvData.filter(r => !r.valid).length} invalid)
            </h4>
            <div className="max-h-60 overflow-y-auto bg-slate-800/50 rounded-lg p-3">
              {csvData.map((row, idx) => (
                <div
                  key={idx}
                  className={`p-2 mb-2 rounded ${row.valid ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-sm">
                      <span className="text-white font-medium">{row.name || 'No name'}</span>
                      <span className="text-slate-400 ml-2">{formatAddress(row.walletAddress)}</span>
                      <span className="text-slate-400 ml-2">{row.salary} {row.currency}</span>
                    </div>
                    {!row.valid && <span className="text-red-400 text-xs">{row.error}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {uploadProgress.status && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">{uploadProgress.status}</p>
                <div className="mt-2 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  {uploadProgress.current} / {uploadProgress.total}
                </p>
              </div>
            )}

            {/* Bulk Add Button */}
            <button
              onClick={handleBulkAddEmployees}
              disabled={actionLoading === 'bulk-add' || csvData.filter(r => r.valid).length === 0}
              className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white disabled:opacity-50"
            >
              {actionLoading === 'bulk-add' ? 'Adding Employees...' : `Add ${csvData.filter(r => r.valid).length} Employee(s)`}
            </button>
          </div>
        )}

        {/* Download Template Button */}
        <button
          onClick={() => {
            const template = 'Name,Wallet Address,Salary,Token,Schedule,Tax%\nJohn Doe,0x0000000000000000000000000000000000000000,5000,mUSDC,monthly,7';
            const blob = new Blob([template], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'employee_template.csv';
            a.click();
          }}
          className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
        >
          Download CSV Template
        </button>
      </div>
    </div>
  );

  const renderFunding = () => (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Fund Your Contract</h2>
          <button
            onClick={() => onNavigate && onNavigate('faucet')}
            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center space-x-1 mt-1"
          >
            <Droplet className="w-3 h-3" />
            <span>Need tokens? Get them here</span>
          </button>
        </div>
        <button onClick={() => setCurrentStep('dashboard')} className="text-slate-400 hover:text-white flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">{success}</div>}

      {/* Current Balances */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">ETH Balance</p>
          <p className="text-xl font-bold text-white">{parseFloat(contractBalance.eth).toFixed(4)} ETH</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">mUSDC Balance</p>
          <p className="text-xl font-bold text-white">{parseFloat(contractBalance.usdc).toFixed(2)} mUSDC</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">mETH Balance</p>
          <p className="text-xl font-bold text-white">{parseFloat(contractBalance.meth).toFixed(4)} mETH</p>
        </div>
      </div>

      {/* Funding Section with FundingForm */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">Fund Your Contract</h3>

        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <FundingForm
          companyContract={companyContract}
          onSuccess={() => {
            setSuccess('Funds added successfully! 1% service fee has been sent to DeCipherLabs treasury.');
            loadContractData();
          }}
          onError={(err) => setError(err)}
          setActionLoading={setActionLoading}
          actionLoading={actionLoading}
        />
      </div>

      {/* Withdraw Section */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 mt-6">
        <h3 className="text-xl font-bold text-white mb-6">Withdraw Funds</h3>
        <p className="text-slate-400 text-sm mb-6">
          Emergency withdrawal of funds from the contract. Only use this if you need to recover funds.
        </p>
        <WithdrawForm
          companyContract={companyContract}
          contractBalance={contractBalance}
          onSuccess={() => {
            setSuccess('Funds withdrawn successfully!');
            loadContractData();
          }}
          onError={(err) => setError(err)}
          setActionLoading={setActionLoading}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Process Payments</h2>
        <button onClick={() => setCurrentStep('dashboard')} className="text-slate-400 hover:text-white flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">{success}</div>}

      <div className="bg-slate-900/50 p-6 rounded-xl border border-blue-500/20">
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="text-white font-medium mb-2 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Payment Overview</span>
          </h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Total Employees</p>
              <p className="text-white font-bold">{employees.length}</p>
            </div>
            <div>
              <p className="text-slate-400">Contract ETH</p>
              <p className="text-white font-bold">{parseFloat(contractBalance.eth).toFixed(4)}</p>
            </div>
            <div>
              <p className="text-slate-400">Contract mUSDC</p>
              <p className="text-white font-bold">{parseFloat(contractBalance.usdc).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-400">Contract mETH</p>
              <p className="text-white font-bold">{parseFloat(contractBalance.meth).toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* Bulk Payment Control */}
        <div className="mb-6 p-8 bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Run Payroll</h3>
          <p className="text-slate-400 mb-6 max-w-lg">
            Process payments for all <span className="text-white font-semibold">{employees.filter(e => e.active).length} active employees</span>.
            Transactions will be generated for each employee according to their salary settings.
          </p>

          <button
            onClick={handleProcessAllPayments}
            disabled={actionLoading === 'batch-pay' || employees.filter(e => e.active).length === 0}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-green-900/20 flex items-center space-x-3 disabled:opacity-50 disabled:grayscale transition-all transform hover:-translate-y-1"
          >
            {actionLoading === 'batch-pay' ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
            <span>Process All Payments Now</span>
          </button>
        </div>

        <h3 className="text-lg font-semibold text-white mb-4">Individual Employee Payments</h3>

        {employees.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No employees to pay yet.</p>
            <button onClick={() => setCurrentStep('addEmployee')} className="mt-3 text-blue-400 hover:text-blue-300">
              Add your first employee →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((emp, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border ${emp.active
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-slate-900/30 border-slate-800 opacity-70'
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${emp.active
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                    : 'bg-slate-600'
                    }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className={`font-mono ${emp.active ? 'text-white' : 'text-slate-500'}`}>{emp.address?.slice(0, 8)}...{emp.address?.slice(-6)}</p>
                    <p className={`text-sm ${emp.active ? 'text-slate-400' : 'text-slate-600'}`}>{emp.salaryPerPeriod} per {['week', '2 weeks', 'month', 'custom'][emp.frequency]}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs ${emp.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-400'}`}>
                    {emp.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleProcessPayment(emp.address)}
                    disabled={actionLoading === `pay-${emp.address}` || !emp.active}
                    className={`px-4 py-2 rounded-lg text-white text-sm flex items-center space-x-2 ${emp.active
                      ? 'bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-slate-600 cursor-not-allowed opacity-60'
                      }`}
                  >
                    {actionLoading === `pay-${emp.address}` ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : emp.active ? (
                      <>
                        <DollarSign className="w-4 h-4" />
                        <span>Pay Now</span>
                      </>
                    ) : (
                      <span>Cannot Pay</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderEmployeePortal = () => {
    const employeeData = employees.find(e => e.address.toLowerCase() === account.toLowerCase());

    if (!employeeData && !loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your employee profile...</p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Employee Portal</h2>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, {employeeData?.name || formatAddress(account)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentStep('dashboard')}
              className="p-2 text-slate-400 hover:text-white transition-colors flex items-center space-x-1 mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={loadContractData}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${employeeData?.active ? 'bg-green-500' : 'bg-red-500'}`} />
              <h3 className="text-slate-400 text-sm font-medium">Status</h3>
            </div>
            <p className="text-2xl font-bold text-white">{employeeData?.active ? 'Active' : 'Inactive'}</p>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-xl border border-purple-500/20">
            <div className="flex items-center space-x-3 mb-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <h3 className="text-slate-400 text-sm font-medium">Salary</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {employeeData?.salaryPerPeriod} <span className="text-sm text-purple-400">{employeeData?.currency}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Per {employeeData?.interval} days</p>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-xl border border-green-500/20">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-4 h-4 text-green-400" />
              <h3 className="text-slate-400 text-sm font-medium">Next Payment</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {employeeData?.lastPaid ? new Date((parseInt(employeeData.lastPaid) + (parseInt(employeeData.interval) * 86400)) * 1000).toLocaleDateString() : 'Pending'}
            </p>
          </div>
        </div>

        {/* Recent Activity / Info */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white">Employment Details</h3>
          </div>
          <div className="p-6 space-y-4">
            {employeeData?.name && (
              <div className="flex justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-400">Employee Name</span>
                <span className="text-white font-medium">{employeeData.name}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Wallet Address</span>
              <span className="text-white font-mono text-sm">{account}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Company Contract</span>
              <span className="text-white font-mono text-sm">{companyContract}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Payment Schedule</span>
              <span className="text-white capitalize">{employeeData?.interval === '7' ? 'Weekly' : employeeData?.interval === '14' ? 'Bi-weekly' : 'Monthly'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <button onClick={() => setCurrentStep('dashboard')} className="text-slate-400 hover:text-white flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" /><span>Back</span>
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">{success}</div>}

      <div className="space-y-6">
        {/* Hedge Vault Configuration */}
        <div className="bg-slate-900/50 p-6 rounded-xl border border-blue-500/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>Hedge Vault Configuration</span>
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Configure automatic risk management for employee crypto salaries
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Employee</label>
              <select
                value={selectedEmployeeForHedge}
                onChange={(e) => setSelectedEmployeeForHedge(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Employee</option>
                {employees.filter(e => e.active).map((emp, idx) => (
                  <option key={idx} value={emp.address}>
                    {emp.name ? `${emp.name} (${emp.address.slice(0, 6)}...${emp.address.slice(-4)})` : `${emp.address.slice(0, 6)}...${emp.address.slice(-4)}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Risk Level</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'CONSERVATIVE', label: 'Conservative', desc: '20% volatile, 80% stable' },
                  { value: 'MODERATE', label: 'Moderate', desc: '40% volatile, 60% stable' },
                  { value: 'AGGRESSIVE', label: 'Aggressive', desc: '60% volatile, 40% stable' }
                ].map((risk) => (
                  <button
                    key={risk.value}
                    onClick={() => setHedgeVaultConfig({ ...hedgeVaultConfig, riskLevel: risk.value })}
                    className={`p-4 rounded-lg border-2 transition-all ${hedgeVaultConfig.riskLevel === risk.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                      }`}
                  >
                    <div className="text-white font-medium mb-1">{risk.label}</div>
                    <div className="text-slate-400 text-xs">{risk.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Volatility Threshold: {hedgeVaultConfig.volatilityThreshold / 100}%
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={hedgeVaultConfig.volatilityThreshold}
                onChange={(e) => setHedgeVaultConfig({ ...hedgeVaultConfig, volatilityThreshold: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Trigger rebalancing when volatility exceeds this threshold
              </p>
            </div>

            <button
              onClick={handleConfigureHedgeVault}
              disabled={actionLoading === 'configure-hedge' || !selectedEmployeeForHedge}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'configure-hedge' ? 'Configuring...' : 'Configure Hedge Vault'}
            </button>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-slate-900/50 p-6 rounded-xl border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span>Tax Settings</span>
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Enable Tax System</p>
                  <p className="text-slate-400 text-sm">Automatically deduct taxes from employee payments</p>
                </div>
                <button
                  onClick={() => handleToggleTax(!taxSettings.enabled)}
                  disabled={actionLoading === 'toggle-tax'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${taxSettings.enabled ? 'bg-green-600' : 'bg-slate-600'
                    } ${actionLoading === 'toggle-tax' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${taxSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tax Recipient Address
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Where tax deductions will be sent
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={taxSettings.recipientAddress}
                  onChange={(e) => setTaxSettings({ ...taxSettings, recipientAddress: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="0x..."
                />
                <button
                  onClick={handleSetTaxRecipient}
                  disabled={actionLoading === 'set-tax-recipient' || !taxSettings.recipientAddress}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white disabled:opacity-50 whitespace-nowrap"
                >
                  {actionLoading === 'set-tax-recipient' ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-purple-300 text-sm">
                <strong>Status:</strong> Tax system is currently {taxSettings.enabled ? '✅ ENABLED' : '❌ DISABLED'}
              </p>
              {!taxSettings.enabled && (
                <p className="text-slate-400 text-xs mt-1">
                  Enable tax and set a recipient address to start deducting taxes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const renderNotConnected = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="bg-slate-900/50 p-8 rounded-xl border border-blue-500/20 max-w-md">
          <Wallet className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-4">Connect Your Wallet</h3>
          <p className="text-slate-400 mb-6">Connect your wallet to access or create your payroll dashboard.</p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-950/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate && onNavigate('landing')}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                DeCipherLabs
              </span>
              {companyDetails.name && (
                <span className="text-slate-400 text-sm ml-2">
                  | {companyDetails.name}
                </span>
              )}
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate && onNavigate('faucet')}
                className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-2 text-sm"
              >
                <Droplet className="w-4 h-4" />
                <span>Get Tokens</span>
              </button>
              {account ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-slate-300 font-mono bg-slate-800/50 px-3 py-1.5 rounded-lg">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </div>
                  <button
                    onClick={onDisconnect}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-white transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!account ? renderNotConnected() : (
          <>
            {currentStep === 'loading' && renderLoading()}
            {currentStep === 'selectCompany' && renderSelectCompany()}
            {currentStep === 'setup' && renderSetup()}
            {currentStep === 'dashboard' && renderDashboard()}
            {currentStep === 'employees' && renderEmployeeManagement()}
            {currentStep === 'addEmployee' && renderAddEmployee()}
            {currentStep === 'funding' && renderFunding()}
            {currentStep === 'payments' && renderPayments()}
            {currentStep === 'settings' && renderSettings()}
            {currentStep === 'employee' && renderEmployeePortal()}
          </>
        )}
      </div>
    </div>
  );
};

export default PayrollDashboard;

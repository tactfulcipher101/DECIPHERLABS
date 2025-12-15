import { ethers } from 'ethers';

// Add polyfills for browser compatibility
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
}

// Network Configuration
export const BASE_CHAIN_ID = 8453; // Base Mainnet
export const BASE_TESTNET_CHAIN_ID = 84532; // Base Sepolia Testnet
export const CHAIN_ID = BASE_TESTNET_CHAIN_ID; // Use testnet for development

export const NETWORK_CONFIG = {
  [BASE_CHAIN_ID]: {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
  },
  [BASE_TESTNET_CHAIN_ID]: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org', import.meta.env.VITE_BASE_SEPOLIA_RPC],
    blockExplorerUrls: ['https://sepolia.basescan.org']
  }
};

// Contract Addresses - UPDATE THESE AFTER DEPLOYMENT
// To set up your treasury address:
// 1. Deploy DeCipherLabs_PayrollFactory with your treasury address and 100 bps (1% fee)
// 2. Replace the placeholder address below with your deployed factory address
export const FACTORY_ADDRESS = '0xE7f1cCB2fA6b47169643e243A546aAD27A6a8Af2';

// Example deployment (using foundry/hardhat):
// factory = new DeCipherLabs_PayrollFactory(yourTreasuryAddress, 100); // 100 = 1% fee
// Factory address: 0xYourDeployedFactoryAddress
// Treasury address: 0xYourTreasuryAddress (receives 1% fees)
// Add the correct contract addresses

export const USDC_ADDRESS = '0x799562f15e87d55aD66209bd63B4a87069D76dF3';
export const HEDGE_VAULT_MANAGER_ADDRESS = '0xDf73efbCA01BaF9cBA1a4B588EcB225d84C97775';

// Supported Tokens
export const SUPPORTED_TOKENS = {
  'mUSDC': {
    address: '0x799562f15e87d55aD66209bd63B4a87069D76dF3',
    symbol: 'mUSDC',
    decimals: 18
  },
  'mETH': {
    address: '0x667E3c1507791e96A4AF670db14bE20c53267C2D',
    symbol: 'mETH',
    decimals: 18
  }
};

// Payment Frequencies
export const PAYMENT_FREQUENCIES = {
  WEEKLY: 0,
  BIWEEKLY: 1,
  MONTHLY: 2,
  CUSTOM: 3
};

export const FREQUENCY_LABELS = {
  0: 'Weekly',
  1: 'Bi-weekly',
  2: 'Monthly',
  3: 'Custom'
};

// Check if wallet is installed
export const isWalletInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Initialize Web3 and event listeners
let walletListeners = {
  accountsChanged: null,
  chainChanged: null,
  disconnect: null
};

// Connect wallet
export const connectWallet = async () => {
  if (!isWalletInstalled()) {
    throw new Error('Please install MetaMask or another Web3 wallet');
  }

  try {
    // First, clear any existing connection
    await disconnectWallet().catch(console.error);

    // Request new accounts and reset connection
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
      params: [{ eth_accounts: {} }]
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Check network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (parseInt(chainId, 16) !== CHAIN_ID) {
      await switchNetwork();
    }

    const signer = provider.getSigner();

    // Setup event listeners with specific handlers
    const handleAccountsChanged = (accounts) => {
      console.log('Accounts changed:', accounts);
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        localStorage.setItem('lastConnectedAccount', accounts[0]);
        window.location.reload();
      }
    };

    const handleChainChanged = (chainId) => {
      console.log('Chain changed:', chainId);
      localStorage.setItem('lastChainId', chainId);
      window.location.reload();
    };

    const handleDisconnect = () => {
      console.log('Disconnect event received');
      disconnectWallet();
    };

    // Remove any existing listeners first
    window.ethereum.removeListener('accountsChanged', walletListeners.accountsChanged);
    window.ethereum.removeListener('chainChanged', walletListeners.chainChanged);
    window.ethereum.removeListener('disconnect', walletListeners.disconnect);

    // Set up new listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Store new listeners
    walletListeners = {
      accountsChanged: handleAccountsChanged,
      chainChanged: handleChainChanged,
      disconnect: handleDisconnect
    };

    // Store connection state with more details
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('lastConnectedAccount', accounts[0]);
    localStorage.setItem('lastChainId', chainId);

    return { address: accounts[0], signer };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Please connect your wallet to continue');
    }
    console.error('Failed to connect wallet:', error);
    throw new Error('Failed to connect wallet: ' + (error.message || 'Unknown error'));
  }
};

// Disconnect wallet
export const disconnectWallet = async () => {
  try {
    if (window.ethereum && walletListeners) {
      // First attempt to request accounts to trigger MetaMask's disconnect
      try {
        const accounts = await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        console.log('Permissions reset:', accounts);
      } catch (permError) {
        console.log('Permission reset failed:', permError);
      }

      // Force clear accounts
      try {
        await window.ethereum.request({
          method: 'eth_accounts',
          params: []
        });
      } catch (accountError) {
        console.log('Account clear failed:', accountError);
      }

      // Remove all listeners with specific cleanup
      if (walletListeners.accountsChanged) {
        window.ethereum.removeListener('accountsChanged', walletListeners.accountsChanged);
      }
      if (walletListeners.chainChanged) {
        window.ethereum.removeListener('chainChanged', walletListeners.chainChanged);
      }
      if (walletListeners.disconnect) {
        window.ethereum.removeListener('disconnect', walletListeners.disconnect);
      }

      // Additional cleanup for any other listeners
      if (window.ethereum.removeAllListeners) {
        window.ethereum.removeAllListeners();
      }

      // Reset listeners object
      walletListeners = {
        accountsChanged: null,
        chainChanged: null,
        disconnect: null
      };

      // Clear all stored state
      const keysToRemove = [
        'walletConnected',
        'companyContract',
        'lastConnectedAccount',
        'lastChainId',
        'lastProvider',
        'lastSigner',
        'walletType',
        'accountData'
      ];

      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();

      // Reset provider state if possible
      if (window.ethereum._state) {
        try {
          window.ethereum._state.accounts = [];
          window.ethereum._state.isConnected = false;
          window.ethereum._state.selectedAddress = null;
        } catch (stateError) {
          console.log('Provider state reset failed:', stateError);
        }
      }

      // Try to clear the MetaMask connection
      try {
        if (window.ethereum.disconnect) {
          await window.ethereum.disconnect();
        }
      } catch (disconnectError) {
        console.log('Provider disconnect failed:', disconnectError);
      }
    }

    // Force reload the page to reset all React state
    window.location.reload();

    return true;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw new Error('Failed to disconnect wallet: ' + (error.message || 'Unknown error'));
  }
};

// Switch to Base network
export const switchNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK_CONFIG[CHAIN_ID].chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_CONFIG[CHAIN_ID]],
        });
      } catch (addError) {
        throw new Error('Failed to add network');
      }
    } else {
      throw new Error('Failed to switch network');
    }
  }
};

// Get provider and signer
export const getProviderAndSigner = async () => {
  if (!isWalletInstalled()) {
    throw new Error('No wallet found');
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Verify connection state
    const isConnected = await provider.send('eth_accounts', [])
      .then(accounts => accounts && accounts.length > 0)
      .catch(() => false);

    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }

    const signer = await provider.getSigner();
    return { provider, signer };
  } catch (error) {
    console.error('Error getting provider and signer:', error);
    // Clean up connection state if provider/signer fails
    localStorage.removeItem('walletConnected');
    throw new Error('Failed to initialize Web3: ' + (error.message || 'Unknown error'));
  }
};

// Get contract instance
export const getContract = async (address, abi) => {
  const { signer } = await getProviderAndSigner();
  return new ethers.Contract(address, abi, signer);
};

// Get read-only contract (no signer needed)
export const getReadOnlyContract = async (address, abi) => {
  const provider = new ethers.providers.JsonRpcProvider(NETWORK_CONFIG[CHAIN_ID].rpcUrls[0]);
  return new ethers.Contract(address, abi, provider);
};

// Format address
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format token amount
export const formatTokenAmount = (amount, decimals = 18) => {
  try {
    return ethers.utils.formatUnits(amount, decimals);
  } catch {
    return '0';
  }
};

// Parse token amount
export const parseTokenAmount = (amount, decimals = 18) => {
  try {
    return ethers.utils.parseUnits(amount.toString(), decimals);
  } catch {
    return ethers.utils.parseUnits('0', decimals);
  }
};

// Get current timestamp
export const getCurrentTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

// Format timestamp to readable date
export const formatTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 0) return 'Not set';
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date to timestamp
export const dateToTimestamp = (date) => {
  return Math.floor(new Date(date).getTime() / 1000);
};

// Calculate next payment date
export const calculateNextPayment = (lastPayment, frequency, customSeconds = 0) => {
  const frequencies = {
    0: 7 * 24 * 60 * 60,      // WEEKLY
    1: 14 * 24 * 60 * 60,     // BIWEEKLY
    2: 30 * 24 * 60 * 60,     // MONTHLY
    3: customSeconds           // CUSTOM
  };

  const seconds = frequencies[frequency] || 0;
  return Number(lastPayment) + seconds;
};

// Check if payment is due
export const isPaymentDue = (nextPayTimestamp) => {
  return getCurrentTimestamp() >= Number(nextPayTimestamp);
};

// Get explorer URL
export const getExplorerUrl = (address, type = 'address') => {
  const baseUrl = NETWORK_CONFIG[CHAIN_ID].blockExplorerUrls[0];
  return `${baseUrl}/${type}/${address}`;
};

// Get transaction URL
export const getTransactionUrl = (txHash) => {
  return getExplorerUrl(txHash, 'tx');
};

// Wait for transaction
export const waitForTransaction = async (txHash) => {
  const { provider } = await getProviderAndSigner();
  const receipt = await provider.waitForTransaction(txHash);
  return receipt;
};

// Get native balance (ETH)
export const getBalance = async (address) => {
  const { provider } = await getProviderAndSigner();
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
};

// Get ERC20 token info
export const getTokenInfo = async (tokenAddress) => {
  if (tokenAddress === ethers.constants.AddressZero || !tokenAddress) {
    return {
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum'
    };
  }

  const abi = [
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function name() view returns (string)'
  ];

  try {
    const contract = await getReadOnlyContract(tokenAddress, abi);
    const [symbol, decimals, name] = await Promise.all([
      contract.symbol(),
      contract.decimals(),
      contract.name()
    ]);

    return { symbol, decimals: Number(decimals), name };
  } catch (error) {
    console.error('Error getting token info:', error);
    return { symbol: 'Unknown', decimals: 18, name: 'Unknown Token' };
  }
};

// Get ERC20 balance
export const getERC20Balance = async (tokenAddress, walletAddress) => {
  if (tokenAddress === ethers.constants.AddressZero || !tokenAddress) {
    return await getBalance(walletAddress);
  }

  const abi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];

  const contract = await getReadOnlyContract(tokenAddress, abi);
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(walletAddress),
    contract.decimals()
  ]);

  return ethers.utils.formatUnits(balance, decimals);
};

// Approve ERC20 spending
export const approveERC20 = async (tokenAddress, spenderAddress, amount) => {
  const abi = ['function approve(address spender, uint256 amount) returns (bool)'];
  const contract = await getContract(tokenAddress, abi);
  const tx = await contract.approve(spenderAddress, amount);
  await tx.wait();
  return tx.hash;
};

// Check ERC20 allowance
export const checkAllowance = async (tokenAddress, ownerAddress, spenderAddress) => {
  const abi = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];

  const contract = await getReadOnlyContract(tokenAddress, abi);
  const [allowance, decimals] = await Promise.all([
    contract.allowance(ownerAddress, spenderAddress),
    contract.decimals()
  ]);

  return ethers.utils.formatUnits(allowance, decimals);
};

// Event listeners
export const onAccountsChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

export const onChainChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

export const removeListeners = () => {
  if (window.ethereum) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};

// Calculate fees
export const calculateFees = (grossAmount, feeBps = 100, taxBps = 1000) => {
  const gross = parseFloat(grossAmount);
  const fee = gross * (feeBps / 10000); // 100 bps = 1%
  const tax = gross * (taxBps / 10000); // 1000 bps = 10%
  const net = gross - fee - tax;

  return {
    gross: gross.toFixed(2),
    fee: fee.toFixed(2),
    tax: tax.toFixed(2),
    net: net.toFixed(2)
  };
};

// Handle transaction errors
export const handleTransactionError = (error) => {
  if (error.code === 4001) {
    return 'Transaction rejected by user';
  }
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds for transaction';
  }
  if (error.message.includes('user rejected')) {
    return 'Transaction rejected by user';
  }
  return error.message || 'Transaction failed';
};

export default {
  connectWallet,
  disconnectWallet,
  switchNetwork,
  getProviderAndSigner,
  getContract,
  getReadOnlyContract,
  formatAddress,
  formatTokenAmount,
  parseTokenAmount,
  getCurrentTimestamp,
  formatTimestamp,
  dateToTimestamp,
  calculateNextPayment,
  isPaymentDue,
  getExplorerUrl,
  getTransactionUrl,
  waitForTransaction,
  getBalance,
  getTokenInfo,
  getERC20Balance,
  approveERC20,
  checkAllowance,
  onAccountsChanged,
  onChainChanged,
  removeListeners,
  calculateFees,
  handleTransactionError
};

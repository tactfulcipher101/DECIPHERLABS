import { ethers } from 'ethers';

export const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to use this application');
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Set up event listeners
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // Handle disconnection
                localStorage.removeItem('walletConnected');
                window.location.reload();
            } else {
                localStorage.setItem('walletConnected', 'true');
                window.location.reload();
            }
        });

        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });

        window.ethereum.on('disconnect', () => {
            localStorage.removeItem('walletConnected');
            window.location.reload();
        });

        // Store connection state
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('lastConnectedAccount', accounts[0]);

        return {
            address: accounts[0],
            signer,
            provider
        };
    } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
    }
};

export const disconnectWallet = async () => {
    try {
        if (window.ethereum) {
            // Remove event listeners
            window.ethereum.removeAllListeners('accountsChanged');
            window.ethereum.removeAllListeners('chainChanged');
            window.ethereum.removeAllListeners('disconnect');

            // Clear stored state
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('lastConnectedAccount');
            localStorage.removeItem('companyContract');
            sessionStorage.clear();

            // Force page reload to reset all state
            window.location.reload();
        }
        return true;
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
        throw error;
    }
};

export const checkWalletConnection = async () => {
    if (typeof window.ethereum === 'undefined') {
        return false;
    }

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        return accounts.length > 0;
    } catch (error) {
        console.error('Error checking wallet connection:', error);
        return false;
    }
};
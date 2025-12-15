import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import PayrollDashboard from './components/PayrollDashboard';
import FounderDashboard from './components/FounderDashboard';
import DocsPage from './components/DocsPage';
import WhitepaperPage from './components/WhitepaperPage';
import UserGuidePage from './components/UserGuidePage';
import TestingGuidePage from './components/TestingGuidePage';
import TokenFaucet from './components/TokenFaucet';
import { removeListeners } from './utils/web3';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Check URL first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (page) return page;
    }

    // Check localStorage for preferred page
    const preferredPage = localStorage.getItem('preferredPage');
    if (preferredPage) {
      return preferredPage;
    }
    return 'landing';
  });
  const [account, setAccount] = useState(null);
  const [payrollAddress, setPayrollAddress] = useState(null);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    try {
      // Clean up preferred page to avoid persistence issues
      const preferredPage = localStorage.getItem('preferredPage');
      if (preferredPage) {
        // Remove after a short timeout to ensure navigation happens
        setTimeout(() => {
          localStorage.removeItem('preferredPage');
        }, 1000);
      }

      // Check for existing wallet connection
      const checkWalletConnection = async () => {
        if (window.ethereum && window.ethereum.selectedAddress) {
          setAccount(window.ethereum.selectedAddress);
        } else if (window.ethereum) {
          try {
            // Attempt to get accounts silently
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              setAccount(accounts[0]);
            }
          } catch (err) {
            console.log('Could not get accounts:', err);
          }
        }
      };

      checkWalletConnection();
    } catch (err) {
      console.error('[App] initialization error', err);
      setInitError(err);
    }
  }, []);

  const checkConnection = async () => {
    // Wallet connect disabled
    return false;
  };

  const setupListeners = () => {
    // Legacy listeners for window.ethereum
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      setAccount(accounts[0]);
      // Optional: Navigate to landing on account change
      // setCurrentPage('landing');
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const handleConnect = async () => {
    // Wallet connect disabled
    console.info('Wallet connect is temporarily disabled.');
  };

  const handleDisconnect = () => {
    // Local cleanup only
    removeListeners();
    setAccount(null);
    setPayrollAddress(null);
    localStorage.setItem('dapp:disconnected', 'true');
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      // If state exists, use it
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.payrollAddress) {
          setPayrollAddress(event.state.payrollAddress);
        }
      } else {
        // Fallback to URL search params or default
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') || 'landing';
        setCurrentPage(page);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Initial load: Set state from URL if present
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page && page !== currentPage) {
      setCurrentPage(page);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page, data = {}) => {
    const targetPage = page === 'payroll' ? 'payroll' : page;

    // Update state
    setCurrentPage(targetPage);
    if (data.payrollAddress) {
      setPayrollAddress(data.payrollAddress);
    }

    // Push to browser history
    const url = new URL(window.location);
    url.searchParams.set('page', targetPage);
    window.history.pushState(
      { page: targetPage, payrollAddress: data.payrollAddress },
      '',
      url
    );
  };


  return (
    <div className="App">
      {initError ? (
        <div className="min-h-screen flex items-center justify-center text-white">
          <div className="bg-red-900/60 p-6 rounded">
            <h2 className="font-bold text-lg mb-2">Initialization error</h2>
            <pre className="text-sm whitespace-pre-wrap">{String(initError)}</pre>
            <p className="text-sm mt-2">Check the browser console for more details.</p>
          </div>
        </div>
      ) : currentPage === 'landing' ? (
        <LandingPage
          account={account}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onNavigate={navigateTo}
        />
      ) : currentPage === 'treasury' ? (
        <FounderDashboard account={account} onNavigate={setCurrentPage} />
      ) : currentPage === 'docs' ? (
        <DocsPage onNavigate={navigateTo} />
      ) : currentPage === 'whitepaper' ? (
        <WhitepaperPage onNavigate={navigateTo} />
      ) : currentPage === 'user-guide' ? (
        <UserGuidePage onNavigate={navigateTo} />
      ) : currentPage === 'testing' ? (
        <TestingGuidePage onNavigate={navigateTo} />
      ) : currentPage === 'faucet' ? (
        <TokenFaucet account={account} onNavigate={navigateTo} />
      ) : (
        <PayrollDashboard
          account={account}
          setAccount={setAccount}
          payrollAddress={payrollAddress}
          onDisconnect={handleDisconnect}
          onNavigate={navigateTo}
        />
      )}
    </div>
  );
}

export default App;
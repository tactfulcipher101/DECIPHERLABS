import { createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

// Define Base Sepolia chain (custom chain definition)
export const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: 'https://sepolia.base.org' },
  blockExplorers: { default: { name: 'BaseSepoliaScan', url: 'https://sepolia.basescan.org' } }
};

// WalletConnect project ID (optional). Replace with your project id or set env var.
// Read WalletConnect project id from Vite env (VITE_WALLETCONNECT_PROJECT_ID) if provided
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

const chains = [baseSepolia];

// Setup providers
const { publicClient, webSocketPublicClient } = configureChains(chains, [publicProvider()]);

// Create wagmi config with MetaMask and WalletConnect connectors
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: { projectId: WALLETCONNECT_PROJECT_ID }
    })
  ],
  publicClient,
  webSocketPublicClient
});

export default wagmiConfig;

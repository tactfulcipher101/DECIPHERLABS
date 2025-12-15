import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './ErrorBoundary'
// Wallet connection temporarily disabled - not wrapping app with WagmiConfig

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
  </React.StrictMode>
)
import React from 'react';

const DisconnectNotice = ({ onClose }) => {
  const instructions = `To fully remove the site's connection from your wallet (MetaMask):\n\n1. Open MetaMask extension.\n2. Click account avatar → Settings → Security & Privacy (or Connected sites).\n3. Open Connected Sites and remove http://localhost:5174 (or the host you're using).\n4. Reload this page.`;

  const copyInstructions = async () => {
    try {
      await navigator.clipboard.writeText(instructions);
      // eslint-disable-next-line no-alert
      alert('Instructions copied to clipboard');
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Copy failed. Please select and copy the text manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-xl w-full bg-slate-900/80 border border-blue-500/20 rounded-xl p-6 text-white">
        <h3 className="text-lg font-bold mb-3">Disconnected</h3>
        <p className="text-sm text-slate-300 mb-4">Your session has been disconnected locally. To fully remove the site from your wallet, follow these instructions:</p>
        <pre className="bg-slate-800 p-3 rounded text-xs text-slate-200 mb-4 whitespace-pre-wrap">{instructions}</pre>

        <div className="flex items-center justify-end space-x-3">
          <button onClick={copyInstructions} className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 text-sm">Copy Instructions</button>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-sm">Reload App</button>
          <button onClick={onClose} className="px-4 py-2 bg-transparent border border-slate-700 rounded hover:bg-slate-800 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

export default DisconnectNotice;

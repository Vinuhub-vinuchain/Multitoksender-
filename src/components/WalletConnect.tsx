import React, { useEffect } from 'react';
import { useWallet } from '../hooks/usewallet'; 

const WalletConnect: React.FC = () => {
  const { state, connectWallet, disconnectWallet } = useWallet();

  useEffect(() => {
    connectWallet(false); // Auto-detect on mount
  }, [connectWallet]);

  return (
    <div className="section">
      <button
        id="connectWallet"
        style={{ display: state.isConnected ? 'none' : 'inline-block' }}
        onClick={() => connectWallet(true)}
      >
        Connect Wallet
      </button>
      <button
        id="disconnectWallet"
        style={{ display: state.isConnected ? 'inline-block' : 'none' }}
        onClick={disconnectWallet}
      >
        Disconnect Wallet
      </button>
      {state.address && <p id="walletAddress">Connected: <strong>{state.address}</strong></p>}
      <div id="balanceSection" className="section">
        <strong>Balances</strong><br />
        {Object.entries(state.balances).map(([symbol, balance]) => (
          <span key={symbol}>{`${symbol}: ${balance}`}<br /></span>
        ))}
      </div>
      <div id="status">{state.status}</div>
      <div id="spinner" className="spinner" style={{ display: state.isLoading ? 'block' : 'none' }}></div>
    </div>
  );
};

export default WalletConnect;

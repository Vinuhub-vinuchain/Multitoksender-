import React, { useEffect } from 'react';
import WalletConnect from './components/WalletConnect';
import TokenSender from './components/TokenSender';
import TransactionHistory from './components/TransactionHistory';
import './index.css';

const App: React.FC = () => {
  useEffect(() => {
    // Dynamically load ethers.js
    const cdnUrls = [
      'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js',
      'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js',
    ];
    let currentCdnIndex = 0;

    const loadScript = (src: string, callback: (error: Error | null) => void) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => callback(null);
      script.onerror = () => callback(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    };

    const tryLoadEthers = () => {
      if (currentCdnIndex >= cdnUrls.length) {
        document.getElementById('status')!.innerText = 'Error: Failed to load ethers.js from all sources. Check your internet or try again later.';
        console.error('All ethers.js CDNs failed');
        return;
      }
      loadScript(cdnUrls[currentCdnIndex], (error) => {
        if (error) {
          console.error(error);
          currentCdnIndex++;
          tryLoadEthers();
        } else if (typeof window.ethers !== 'undefined') {
          console.log('ethers.js loaded successfully');
        } else {
          currentCdnIndex++;
          tryLoadEthers();
        }
      });
    };

    tryLoadEthers();
  }, []);

  return (
    <div className="container">
      <header>
        <img
          id="logo"
          src="https://photos.pinksale.finance/file/pinksale-logo-upload/1759847695513-f915ce15471ce09f03d8fbf68bc0616f.png"
          alt="VinuHub Logo"
        />
      </header>
      <WalletConnect />
      <TokenSender />
      <TransactionHistory />
    </div>
  );
};

export default App;

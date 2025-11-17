import React from 'react';
import WalletConnect from './components/WalletConnect';
import TokenSender from './components/TokenSender';
import TransactionHistory from './components/TransactionHistory';
import './index.css';

const App: React.FC = () => {
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

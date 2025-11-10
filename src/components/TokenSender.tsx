import React, { useState, ChangeEvent } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';

const TokenSender: React.FC = () => {
  const { state, updateBalance } = useWallet();
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [recipientsText, setRecipientsText] = useState<string>('');

  const contractAddress = '0x41947084cbCe9823B384FffA5b3d2cBeeB5406e7';
  const abi = [
    'function multiSendToken(address _token, address[] _recipients, uint256[] _amounts)',
    'function multiSendNative(address[] _recipients, uint256[] _amounts) payable',
  ];
  const erc20Abi = ['function approve(address, uint256) returns (bool)'];

  const handleTokenAddressChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value.trim();
    setTokenAddress(address);
    await updateBalance(address);
  };

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = event.target?.result?.toString().split('\n').slice(1).filter((line) => line.trim()) || [];
      const validLines = lines
        .map((line) => {
          const [addr, amt] = line.split(',').map((part) => part.trim());
          if (ethers.utils.isAddress(addr) && !isNaN(Number(amt)) && Number(amt) > 0) {
            return `${addr},${amt}`;
          }
          return '';
        })
        .filter((line) => line);
      setRecipientsText(validLines.join('\n'));
      setState((prev) => ({ ...prev, status: `Loaded ${validLines.length} valid recipients from CSV` }));
    };
    reader.readAsText(file);
  };

  const handleApprove = async () => {
    if (!tokenAddress) {
      setState((prev) => ({ ...prev, status: 'No approval needed for VC' }));
      return;
    }
    const lines = recipientsText.split('\n').filter((line) => line.trim());
    if (!state.isConnected || lines.length === 0) {
      setState((prev) => ({ ...prev, status: 'Invalid input or not connected' }));
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, status: 'Approving...' }));
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const token = new ethers.Contract(tokenAddress, erc20Abi, signer);
      const dec = state.currentToken.decimals;
      let total = ethers.BigNumber.from(0);
      lines.forEach((line) => {
        const [, amt] = line.split(',').map((part) => part.trim());
        if (amt && !isNaN(Number(amt))) total = total.add(ethers.utils.parseUnits(amt, dec));
      });
      if (total.eq(0)) {
        setState((prev) => ({ ...prev, status: 'No valid amounts', isLoading: false }));
        return;
      }
      const tx = await token.approve(contractAddress, total);
      await tx.wait();
      setState((prev) => ({ ...prev, status: 'Approved!', isLoading: false }));
      saveHistory(tx.hash, 'Approved', state.currentToken.symbol);
    } catch (error: any) {
      console.error('Approve error:', error);
      setState((prev) => ({ ...prev, status: `Error: ${error.message}`, isLoading: false }));
      saveHistory('N/A', `Approve Failed: ${error.message}`, state.currentToken.symbol);
    }
  };

  const handleSend = async () => {
    const lines = recipientsText.split('\n').filter((line) => line.trim());
    const recipients: string[] = [];
    const amounts: ethers.BigNumber[] = [];
    let totalValue = ethers.BigNumber.from(0);
    const dec = state.currentToken.decimals;

    lines.forEach((line) => {
      const [addr, amt] = line.split(',').map((part) => part.trim());
      if (addr && amt && ethers.utils.isAddress(addr) && !isNaN(Number(amt)) && Number(amt) > 0) {
        const parsedAmt = ethers.utils.parseUnits(amt, dec);
        recipients.push(addr);
        amounts.push(parsedAmt);
        totalValue = totalValue.add(parsedAmt);
      }
    });

    if (recipients.length === 0 || !state.isConnected) {
      setState((prev) => ({ ...prev, status: 'Invalid inputs or not connected', isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, status: 'Sending...' }));
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      let tx;
      if (!tokenAddress) {
        tx = await contract.multiSendNative(recipients, amounts, { value: totalValue });
      } else {
        tx = await contract.multiSendToken(tokenAddress, recipients, amounts);
      }
      await tx.wait();
      setState((prev) => ({
        ...prev,
        status: `Success! <a href="https://vinuexplorer.org/tx/${tx.hash}" target="_blank">View Tx</a>`,
        isLoading: false,
      }));
      saveHistory(tx.hash, 'Success', state.currentToken.symbol);
      await updateBalance(tokenAddress);
    } catch (error: any) {
      console.error('Send error:', error);
      setState((prev) => ({ ...prev, status: `Error: ${error.message}`, isLoading: false }));
      saveHistory('N/A', `Send Failed: ${error.message}`, state.currentToken.symbol);
    }
  };

  const [state, setState] = useState<{ status: string; isLoading: boolean }>({ status: '', isLoading: false });

  const saveHistory = (txHash: string, status: string, tokenSymbol: string) => {
    const history = JSON.parse(localStorage.getItem('vinuhub_history') || '[]');
    history.unshift({ date: new Date().toLocaleString(), txHash, status, token: tokenSymbol });
    localStorage.setItem('vinuhub_history', JSON.stringify(history.slice(0, 50)));
  };

  return (
    <div className="section">
      <label>Token Address (blank for VC)</label>
      <input
        type="text"
        id="tokenAddress"
        placeholder="0x..."
        value={tokenAddress}
        onChange={handleTokenAddressChange}
      />
      <label>Recipients (address,amount per line) or Upload CSV</label>
      <textarea
        id="recipients"
        rows={5}
        placeholder="0xabc...,100&#10;0xdef...,200"
        value={recipientsText}
        onChange={(e) => setRecipientsText(e.target.value)}
      />
      <input type="file" id="csvUpload" accept=".csv" onChange={handleCsvUpload} style={{ marginTop: '10px' }} />
      <div className="btn-group">
        <button id="approveBtn" onClick={handleApprove}>Approve</button>
        <button id="sendBtn" onClick={handleSend}>Send to All</button>
      </div>
      {state.status && <div id="status">{state.status}</div>}
      <div id="spinner" className="spinner" style={{ display: state.isLoading ? 'block' : 'none' }}></div>
    </div>
  );
};

export default TokenSender;

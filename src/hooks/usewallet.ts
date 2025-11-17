import { useState, useCallback } from 'react';
import { ethers } from 'ethers'; // Import ethers directly
import { WalletState, WalletHook } from '../types/wallet';

export const useWallet = (): WalletHook => {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    status: '',
    isLoading: false,
    balances: { VC: '0' },
    currentToken: { address: '', symbol: 'VC', decimals: 18 },
  });

  const rpcUrls = ['https://rpc.vinuchain.org', 'https://vinuchain-rpc.com'];
  const erc20Abi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function approve(address, uint256) returns (bool)',
  ];

  const updateBalance = useCallback(async (tokenAddress?: string) => {
    if (!state.isConnected || !window.ethereum) {
      setState((prev) => ({ ...prev, balances: { VC: '0' }, status: 'Connect wallet to view balances' }));
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const vcBalance = await provider.getBalance(address);
      let balances: { [key: string]: string } = { VC: ethers.utils.formatEther(vcBalance) };

      if (tokenAddress && ethers.utils.isAddress(tokenAddress)) {
        try {
          const token = new ethers.Contract(tokenAddress, erc20Abi, provider);
          const [bal, dec, sym] = await Promise.all([
            token.balanceOf(address),
            token.decimals(),
            token.symbol(),
          ]);
          setState((prev) => ({
            ...prev,
            balances: { ...prev.balances, [sym]: ethers.utils.formatUnits(bal, dec) },
            currentToken: { address: tokenAddress, symbol: sym, decimals: dec },
          }));
        } catch (e) {
          console.error('Token balance fetch error:', e);
          setState((prev) => ({
            ...prev,
            currentToken: { address: '', symbol: 'VC', decimals: 18 },
            status: 'Invalid token address',
          }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          balances,
          currentToken: { address: '', symbol: 'VC', decimals: 18 },
        }));
      }
    } catch (e) {
      console.error('Balance fetch error:', e);
      setState((prev) => ({ ...prev, status: 'Error fetching balances' }));
    }
  }, [state.isConnected]);

  const connectWallet = useCallback(async (manual = false) => {
    console.log(manual ? 'Manual connect initiated' : 'Auto-detecting wallet...');
    setState((prev) => ({ ...prev, isLoading: true, status: manual ? 'Requesting connection...' : 'Auto-detecting wallet...' }));

    try {
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        throw new Error('MetaMask not detected. Install MetaMask from metamask.io.');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      let accounts: string[];
      if (manual) {
        console.log('Requesting accounts manually...');
        accounts = await provider.send('eth_requestAccounts', []);
      } else {
        console.log('Checking existing accounts...');
        accounts = await provider.send('eth_accounts', []);
      }

      if (accounts.length === 0 && !manual) {
        console.log('No accounts found, keeping connect button visible');
        setState((prev) => ({ ...prev, status: 'Please connect your wallet', isLoading: false }));
        return;
      }

      console.log('Accounts:', accounts);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      console.log('Checking network...');
      const network = await provider.getNetwork();
      console.log('Current chain ID:', network.chainId);
      if (network.chainId !== 207) {
        setState((prev) => ({ ...prev, status: 'Switching to VinuChain...' }));
        console.log('Attempting to switch to VinuChain...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xcf' }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            console.log('VinuChain not found, adding...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xcf',
                chainName: 'VinuChain',
                rpcUrls,
                nativeCurrency: { name: 'VC', symbol: 'VC', decimals: 18 },
                blockExplorerUrls: ['https://vinuexplorer.org'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      await updateBalance();
      setState((prev) => ({
        ...prev,
        address: `${address.slice(0, 6)}...${address.slice(-4)}`,
        isConnected: true,
        status: 'Wallet connected successfully!',
        isLoading: false,
      }));
      console.log('Connection successful');
    } catch (error: any) {
      console.error('Connect error:', error);
      let userMessage = 'Connection failed: ';
      if (error.code === 4001 || error.message.includes('User rejected')) {
        userMessage += 'You rejected the request in MetaMask.';
      } else if (error.message.includes('MetaMask not detected')) {
        userMessage += 'Install MetaMask from metamask.io.';
      } else if (error.message.includes('network')) {
        userMessage += 'Network issue. Add VinuChain manually: Chain ID 207, RPC https://rpc.vinuchain.org.';
      } else {
        userMessage += error.message;
      }
      setState((prev) => ({
        ...prev,
        status: userMessage,
        isLoading: false,
      }));
    }
  }, [updateBalance]);

  const disconnectWallet = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      status: 'Wallet disconnected',
      isLoading: false,
      balances: { VC: '0' },
      currentToken: { address: '', symbol: 'VC', decimals: 18 },
    });
    console.log('Wallet disconnected');
  }, []);

  return { state, connectWallet, disconnectWallet, updateBalance };
};

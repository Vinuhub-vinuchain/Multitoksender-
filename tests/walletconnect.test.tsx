import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WalletConnect from '../src/components/WalletConnect';
import { vi } from 'vitest';

describe('WalletConnect', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders Connect Wallet button initially', () => {
    render(<WalletConnect />);
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.queryByText('Disconnect Wallet')).not.toBeInTheDocument();
  });

  it('shows status message when MetaMask is not detected', async () => {
    render(<WalletConnect />);
    await waitFor(() => {
      expect(screen.getByText(/MetaMask not detected/)).toBeInTheDocument();
    });
  });

  it('connects wallet on button click', async () => {
    window.ethereum = {
      isMetaMask: true,
      request: vi.fn().mockImplementation(({ method }) => {
        if (method === 'eth_requestAccounts') return Promise.resolve(['0x1234567890abcdef1234567890abcdef12345678']);
        if (method === 'eth_chainId') return Promise.resolve('0xcf');
        if (method === 'eth_getBalance') return Promise.resolve('1000000000000000000'); // 1 VC
      }),
    };
    render(<WalletConnect />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    await waitFor(() => {
      expect(screen.getByText(/Connected: 0x1234...5678/)).toBeInTheDocument();
      expect(screen.getByText('Disconnect Wallet')).toBeInTheDocument();
      expect(screen.getByText(/VC: 1/)).toBeInTheDocument();
    });
  });

  it('disconnects wallet on button click', async () => {
    window.ethereum = {
      isMetaMask: true,
      request: vi.fn().mockImplementation(({ method }) => {
        if (method === 'eth_requestAccounts') return Promise.resolve(['0x1234567890abcdef1234567890abcdef12345678']);
        if (method === 'eth_chainId') return Promise.resolve('0xcf');
        if (method === 'eth_getBalance') return Promise.resolve('1000000000000000000');
      }),
    };
    render(<WalletConnect />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    await waitFor(() => {
      expect(screen.getByText(/Connected: 0x1234...5678/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Disconnect Wallet'));
    expect(screen.getByText('Wallet disconnected')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });
});

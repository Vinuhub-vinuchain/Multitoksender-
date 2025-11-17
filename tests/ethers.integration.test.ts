import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WalletConnect from '../src/components/WalletConnect';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock window.ethereum
const mockRequest = vi.fn();
const mockOn = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(window, 'ethereum', {
    value: {
      isMetaMask: true,
      request: mockRequest,
      on: mockOn,
      removeListener: vi.fn(),
    },
    writable: true,
  });
});

describe('ethers.js Integration', () => {
  it('detects MetaMask and auto-connects', async () => {
    mockRequest.mockImplementation(({ method }) => {
      if (method === 'eth_accounts') return ['0x1234567890abcdef1234567890abcdef12345678'];
      if (method === 'eth_chainId') return '0xcf';
    });

    render(<WalletConnect />);
    await waitFor(() => {
      expect(screen.getByText(/Connected: 0x1234...5678/)).toBeInTheDocument();
    });
  });

  it('manually connects wallet via button', async () => {
    mockRequest.mockImplementation(({ method }) => {
      if (method === 'eth_requestAccounts') return ['0xabcdef1234567890abcdef1234567890abcdef12'];
    });

    render(<WalletConnect />);
    fireEvent.click(screen.getByText('Connect Wallet'));

    await waitFor(() => {
      expect(screen.getByText(/Connected: 0xabc...ef12/)).toBeInTheDocument();
    });
  });

  it('switches to VinuChain if on wrong network', async () => {
    mockRequest
      .mockImplementationOnce(() => ['0x123...'])
      .mockImplementationOnce(() => '0x1') // Wrong chain (Ethereum)
      .mockImplementationOnce(() => {}); // switch chain

    render(<WalletConnect />);
    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xcf' }],
      });
    });
  });

  it('adds VinuChain if not found (code 4902)', async () => {
    mockRequest
      .mockImplementationOnce(() => ['0x123...'])
      .mockImplementationOnce(() => '0x1')
      .mockRejectedOnce({ code: 4902 })
      .mockImplementationOnce(() => {});

    render(<WalletConnect />);
    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'wallet_addEthereumChain',
        params: expect.arrayContaining([
          expect.objectContaining({ chainId: '0xcf' }),
        ]),
      });
    });
  });

  it('fetches VC balance after connection', async () => {
    mockRequest
      .mockImplementationOnce(() => ['0x1234567890abcdef1234567890abcdef12345678'])
      .mockImplementationOnce(() => '0xcf')
      .mockImplementationOnce(() => '0xde0b6b3a7640000'); // 1 ETH in wei

    render(<WalletConnect />);
    await waitFor(() => {
      expect(screen.getByText(/VC: 1/)).toBeInTheDocument();
    });
  });
});

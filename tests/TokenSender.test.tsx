import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TokenSender from '../src/components/TokenSender';
import { vi } from 'vitest';

describe('TokenSender', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.ethereum = {
      isMetaMask: true,
      request: vi.fn().mockImplementation(({ method }) => {
        if (method === 'eth_requestAccounts') return Promise.resolve(['0x1234567890abcdef1234567890abcdef12345678']);
        if (method === 'eth_chainId') return Promise.resolve('0xcf');
        if (method === 'eth_getBalance') return Promise.resolve('1000000000000000000');
      }),
    };
  });

  it('renders token input and send button', async () => {
    render(<TokenSender />);
    await waitFor(() => {
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Connect Wallet'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument();
      expect(screen.getByText('Send to All')).toBeInTheDocument();
    });
  });

  it('disables send button when not connected', async () => {
    render(<TokenSender />);
    expect(screen.getByText('Send to All')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Send to All'));
    await waitFor(() => {
      expect(screen.getByText(/not connected/)).toBeInTheDocument();
    });
  });
});

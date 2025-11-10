export interface WalletState {
  address: string | null;
  isConnected: boolean;
  status: string;
  isLoading: boolean;
  balances: { [key: string]: string };
  currentToken: { address: string; symbol: string; decimals: number };
}

export interface WalletHook {
  state: WalletState;
  connectWallet: (manual?: boolean) => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: (tokenAddress?: string) => Promise<void>;
}

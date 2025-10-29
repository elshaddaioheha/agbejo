'use client';

import { createContext, useContext } from 'react';

export type WalletProviderType = 'hashpack' | 'blade' | null;

export interface WalletContextType {
  connected: boolean;
  accountId: string | null;
  provider: WalletProviderType;
  connect: (provider: WalletProviderType) => Promise<void>;
  disconnect: () => void;
  signAndExecuteTransaction: (transaction: any) => Promise<any>;
}

export const WalletContext = createContext<WalletContextType>({
  connected: false,
  accountId: null,
  provider: null,
  connect: async () => {},
  disconnect: () => {},
  signAndExecuteTransaction: async () => {},
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
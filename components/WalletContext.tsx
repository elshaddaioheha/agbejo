'use client';

<<<<<<< HEAD
import { createContext, useContext } from 'react';

export interface WalletContextType {
  connected: boolean;
  accountId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndExecuteTransaction: (transaction: any) => Promise<any>;
}

export const WalletContext = createContext<WalletContextType>({
  connected: false,
  accountId: null,
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
=======
import { createContext } from 'react';
import { Client } from '@hashgraph/sdk';

export interface WalletContextType {
  account: string | null;
  provider: Client | null;
}

export const WalletContext = createContext<WalletContextType>({
  account: null,
  provider: null,
});

export const useWallet = () => useContext(WalletContext);
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec

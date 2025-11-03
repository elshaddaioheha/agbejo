'use client';

import { useState, ReactNode } from 'react';
import { WalletContext, WalletProviderType } from './WalletContext';
import { connect as connectWallet, disconnect as disconnectWallet, signAndExecuteTransaction as signTx } from '../lib/wallets';
import { Transaction, TransactionResponse } from '@hashgraph/sdk';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [provider, setProvider] = useState<WalletProviderType>(null);
  const [connected, setConnected] = useState(false);

  const connect = async (provider: WalletProviderType) => {
    try {
      if (!provider) throw new Error('Wallet provider not specified');
      const connectionResult = await connectWallet(provider);

      if (connectionResult && connectionResult.accountIds && connectionResult.accountIds.length > 0) {
        setAccountId(connectionResult.accountIds[0]);
        setProvider(provider);
        setConnected(true);
      }
    } catch (error) {
      console.error('Error connecting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      alert(`Connection failed: ${errorMessage}`);
      throw error;
    }
  };

  const disconnect = () => {
    disconnectWallet();
    setAccountId(null);
    setProvider(null);
    setConnected(false);
  };

  const signAndExecuteTransaction = async (transaction: Transaction): Promise<TransactionResponse> => {
    if (!connected || !accountId) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    if (!(transaction instanceof Transaction)) {
      throw new Error('Invalid transaction object');
    }

    try {
      return await signTx(transaction, accountId);
    } catch (error) {
      console.error('Transaction signing error:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider 
      value={{ 
        connected, 
        accountId, 
        provider,
        connect, 
        disconnect,
        signAndExecuteTransaction 
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export { useWallet } from './WalletContext';
'use client';

import { useState, ReactNode } from 'react';
import { WalletContext, WalletProviderType } from './WalletContext';
import { connect as connectWallet, disconnect as disconnectWallet } from '../lib/wallets';

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
        alert('Connected successfully!');
      }
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Connection failed.');
      throw error;
    }
  };

  const disconnect = () => {
    disconnectWallet();
    setAccountId(null);
    setProvider(null);
    setConnected(false);
  };

  const signAndExecuteTransaction = async (transaction: any) => {
    if (!connected || !provider) {
      throw new Error('Not connected');
    }

    // This is a placeholder. You will need to implement the actual transaction signing
    // based on the provider.
    console.log("Signing and executing transaction with", provider);

    // Example for HashPack (you'll need to adapt this based on the transaction type)
    if (provider === 'hashpack') {
      // You will need to get the hashconnect instance and use it to send the transaction
      // This is a simplified example
    }

    // Example for Blade
    if (provider === 'blade') {
      // You will need to get the bladeConnector instance and use it to send the transaction
      // This is a simplified example
    }

    return Promise.resolve(); // Placeholder
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
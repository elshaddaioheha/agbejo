'use client';

import { useState, ReactNode } from 'react';
import { Client, PrivateKey, AccountId } from '@hashgraph/sdk';
import { WalletContext } from './WalletContext';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = async () => {
    try {
      // Prompt user for their credentials (temporary testing method)
      const inputAccountId = prompt('Enter your Hedera Account ID (format: 0.0.xxxxx):');
      const inputPrivateKey = prompt('Enter your Private Key (starts with 302e...):');

      if (!inputAccountId || !inputPrivateKey) {
        alert('Connection cancelled');
        return;
      }

      const newClient = Client.forTestnet();
      newClient.setOperator(
        AccountId.fromString(inputAccountId),
        PrivateKey.fromString(inputPrivateKey)
      );

      setClient(newClient);
      setAccountId(inputAccountId);
      setConnected(true);
      
      alert('Connected successfully!');
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Connection failed. Please check your credentials.');
      throw error;
    }
  };

  const disconnect = () => {
    if (client) {
      client.close();
    }
    setClient(null);
    setAccountId(null);
    setConnected(false);
  };

  const signAndExecuteTransaction = async (transaction: any) => {
    if (!client || !connected) {
      throw new Error('Not connected');
    }

    try {
      const txResponse = await transaction.execute(client);
      return txResponse;
    } catch (error) {
      console.error('Error executing transaction:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider 
      value={{ 
        connected, 
        accountId, 
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
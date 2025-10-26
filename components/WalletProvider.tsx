'use client';

<<<<<<< HEAD
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
=======
import { useState, useEffect } from 'react';
import { HederaWalletConnect } from '@hashgraph/hedera-wallet-connect';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { WalletContext } from './WalletContext';
import { toast } from 'react-toastify';

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<Client | null>(null);

  useEffect(() => {
    const connectWallet = async () => {
      try {
        const connector = new HederaWalletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          metadata: {
            name: 'Agbejo',
            description: 'P2P Deals Platform on Hedera DLT',
            url: 'https://agbejo.vercel.app',  
            icons: ['https://agbejo.vercel.app/logo.png'],  // Upload logo.png to public/ and reference it
          },
        });

        const session = await connector.connect();
        const accountId = session.namespaces.hedera.accounts[0].split(':')[2]; // Extract Hedera account ID (format: chainId:topic:accountId)
        setAccount(accountId);

        // Initialize Hedera client for testnet (switch to mainnet for production)
        const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
        const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
        setProvider(client);

        //Operator Setup
        const privateKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
        if (privateKey && accountId) {
          client.setOperator(accountId, PrivateKey.fromString(privateKey));
        }
        setProvider(client);

        connector.on('session_update', ({ namespaces }) => {
          setAccount(namespaces.hedera.accounts[0]?.split(':')[2] || null);
        });

        return () => {
          connector.disconnect();
        };
      } catch (error) {
        console.error('Error connecting wallet:', error);
        toast.error('Failed to connect wallet. Please try again or check your network.');
      }
    };

    connectWallet();
  }, []);

  return (
    <WalletContext.Provider value={{ account, provider }}>
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec
      {children}
    </WalletContext.Provider>
  );
};
<<<<<<< HEAD

export { useWallet } from './WalletContext';
=======
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec

'use client';

import { useState, useEffect } from 'react';
import { HederaWalletConnect } from '@hashgraph/hedera-wallet-connect';
import { Client } from '@hashgraph/sdk';
import { WalletContext } from './WalletContext';

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
        const client = Client.forTestnet();
        setProvider(client);

        connector.on('session_update', ({ namespaces }) => {
          setAccount(namespaces.hedera.accounts[0]?.split(':')[2] || null);
        });

        return () => {
          connector.disconnect();
        };
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    };

    connectWallet();
  }, []);

  return (
    <WalletContext.Provider value={{ account, provider }}>
      {children}
    </WalletContext.Provider>
  );
};

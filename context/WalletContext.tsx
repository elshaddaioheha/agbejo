'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import type { AccountId, Transaction, LedgerId } from '@hashgraph/sdk';

interface WalletContextType {
  accountId: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  executeTransaction: (tx: Transaction) => Promise<any>;
  error: string | null;
  loading: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [hashConnect, setHashConnect] = useState<any>(null);
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { HashConnect, HashConnectConnectionState } = await import('hashconnect');
        const { LedgerId } = await import('@hashgraph/sdk');

        const appMetadata = {
          name: 'Project Agbejo',
          description: 'A decentralized escrow and dispute resolution service on Hedera.',
          icons: ['https://www.hashpack.app/img/logo.svg'],
          url: typeof window !== 'undefined' ? window.location.origin : '',
        };

        const projectId = "e5633dd36d915a6c8d2d7785951b4a6d";
        if (!projectId) {
          throw new Error("NEXT_PUBLIC_PROJECT_ID is not configured in environment variables.");
        }

        const hc = new HashConnect(
          LedgerId.TESTNET,
          projectId,
          appMetadata,
          true
        );

        hc.pairingEvent.on((pairingData: any) => {
          if (pairingData.accountIds && pairingData.accountIds.length > 0) {
            setAccountId(pairingData.accountIds[0]);
            setTopic(pairingData.topic);
          }
        });

        hc.connectionStatusChangeEvent.on((state: any) => {
          if (state === HashConnectConnectionState.Disconnected) {
            setAccountId(null);
            setTopic(null);
          }
        });

        await hc.init();
        setHashConnect(hc);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during initialization.';
        console.error('Failed to initialize HashConnect:', err);
        setError(`Initialization failed: ${errorMessage}`);
        setLoading(false);
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting || !hashConnect) {
      if (!hashConnect) {
        setError('HashConnect could not be initialized. Please check the console and refresh.');
      }
      return;
    }

    setIsConnecting(true);
    try {
      setError(null);
      await hashConnect.openPairingModal();
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, [hashConnect, isConnecting]);

  const disconnect = useCallback(async () => {
    if (isDisconnecting || !hashConnect || !topic) return;

    setIsDisconnecting(true);
    try {
        await hashConnect.disconnect(topic);
    } catch (err) {
        console.error('Error during hashConnect.disconnect:', err);
    } finally {
        localStorage.removeItem('hashconnect-data');
        setAccountId(null);
        setTopic(null);
        setError(null);
        setIsDisconnecting(false);
        console.log('Wallet disconnected and session wiped from localStorage.');
    }
}, [hashConnect, topic, isDisconnecting]);

  const executeTransaction = useCallback(
    async (tx: Transaction) => {
      if (!hashConnect || !accountId) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      try {
        const { AccountId } = await import('@hashgraph/sdk');
        const acctId = AccountId.fromString(accountId);
        const signer = hashConnect.getSigner(acctId);

        const frozenTx = await tx.freezeWithSigner(signer);
        const response = await frozenTx.executeWithSigner(signer);
        
        return response;
      } catch (err: any) {
        console.error('Transaction failed:', err);
        
        if (err.message?.includes('User rejected') || err.message?.includes('rejected')) {
          throw new Error('Transaction was rejected. Please approve the transaction in your wallet.');
        }
        
        throw new Error(err.message || 'Transaction failed. Please try again.');
      }
    },
    [hashConnect, accountId]
  );

  return (
    <WalletContext.Provider
      value={{
        accountId,
        connect,
        disconnect,
        executeTransaction,
        error,
        loading,
        isConnecting,
        isDisconnecting,
      }}
    >
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#ffcccc', color: '#a60000', textAlign: 'center' }}>
          <strong>Configuration Error:</strong> {error}
        </div>
      )}
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;

};

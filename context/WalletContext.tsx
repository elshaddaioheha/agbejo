'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { AccountId, Transaction, LedgerId } from '@hashgraph/sdk';

// --- Types ---
interface WalletContextType {
  accountId: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  executeTransaction: (tx: Transaction) => Promise<any>;
  error: string | null;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [hashConnect, setHashConnect] = useState<any>(null);
  const [topic, setTopic] = useState<string | null>(null);

  const hasInitialized = useRef(false);

  // --- Initialize HashConnect v3 dynamically ---
  useEffect(() => {
    if (hasInitialized.current || typeof window === 'undefined') return;
    hasInitialized.current = true;

    // Clear stale localStorage to prevent multiple pairing
    localStorage.removeItem('hashconnect-session');
    localStorage.removeItem('hashconnectPairingData');

    (async () => {
      try {
        const { HashConnect, HashConnectConnectionState } = await import('hashconnect');
        
        const projectId = process.env.NEXT_PUBLIC_HASHCONNECT_PROJECT_ID || "e5633dd36d915a6c8d2d7785951b4a6d";
        if (!projectId) {
          console.warn('⚠️ Missing NEXT_PUBLIC_HASHCONNECT_PROJECT_ID in .env. Using default (may cause errors).');
        }

        const appMetadata = {
          name: 'Project Agbejo',
          description: 'A decentralized escrow and dispute resolution service on Hedera.',
          icons: ['https://www.hashpack.app/img/logo.svg'],
          url: window.location.origin,
        };

        const hc = new HashConnect(LedgerId.TESTNET, projectId, appMetadata, true);
        setHashConnect(hc);

        hc.pairingEvent.on((pairingData: any) => {
          console.log('Pairing event:', pairingData);
          if (pairingData.accountIds && pairingData.accountIds.length > 0) {
            setAccountId(pairingData.accountIds[0]);
            setTopic(pairingData.topic);
          }
        });

        hc.connectionStatusChangeEvent.on((state: any) => {
          console.log('Connection status:', state);
          if (state === HashConnectConnectionState.Disconnected) {
            setAccountId(null);
            setTopic(null);
          }
        });

        await hc.init();
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize HashConnect:', err);
        setError('Failed to initialize wallet connection. Please refresh the page.');
        setLoading(false);
      }
    })();
  }, []);

  // --- Connect to Wallet with Retry ---
  const connect = useCallback(async () => {
    if (!hashConnect) {
      setError('HashConnect not initialized.');
      return;
    }

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        setError(null);
        console.log(`Attempting to pair (try ${retries + 1}/${maxRetries})`);
        await hashConnect.openPairingModal();
        break; // Exit loop on success
      } catch (err: any) {
        console.error('Pairing attempt failed:', err);
        if (err.message.includes('Proposal expired') && retries < maxRetries - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        } else {
          setError(err.message || 'Failed to connect wallet. Please try again.');
          break;
        }
      }
    }
  }, [hashConnect]);

  // --- Disconnect ---
  const disconnect = useCallback(async () => {
    if (!hashConnect || !topic) return;
    try {
      await hashConnect.disconnect(topic);
      setAccountId(null);
      setTopic(null);
      setError(null);
      console.log('Disconnected successfully');
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError('Failed to disconnect wallet.');
    }
  }, [hashConnect, topic]);

  // --- Execute Transaction ---
  const executeTransaction = useCallback(
    async (tx: Transaction) => {
      if (!hashConnect || !accountId) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      try {
        const acctId = AccountId.fromString(accountId);
        const signer = hashConnect.getSigner(acctId);

        const frozenTx = await tx.freezeWithSigner(signer);
        const response = await frozenTx.executeWithSigner(signer);
        
        console.log('Transaction executed:', response.transactionId.toString());
        
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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
};
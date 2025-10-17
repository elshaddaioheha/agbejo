'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
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

  // --- Initialize HashConnect v3 dynamically ---
  useEffect(() => {
    (async () => {
      try {
        const { HashConnect, HashConnectConnectionState } = await import('hashconnect');
        
        const appMetadata = {
          name: 'Project Agbejo',
          description: 'A decentralized escrow and dispute resolution service on Hedera.',
          icons: ['https://www.hashpack.app/img/logo.svg'],
          url: typeof window !== 'undefined' ? window.location.origin : '',
        };

        // Initialize HashConnect v3 with LedgerId from @hashgraph/sdk
        const hc = new HashConnect(
          LedgerId.TESTNET,
          "e5633dd36d915a6c8d2d7785951b4a6d",
          appMetadata,
          true
        );

        // Set up event listeners BEFORE calling init
        hc.pairingEvent.on((pairingData: any) => {
          console.log('Pairing event:', pairingData);
          if (pairingData.accountIds && pairingData.accountIds.length > 0) {
            setAccountId(pairingData.accountIds[0]);
            setTopic(pairingData.topic);
          }
        });

        hc.connectionStatusChangeEvent.on((state: any) => {
          console.log('Connection status changed:', state);
          if (state === HashConnectConnectionState.Disconnected) {
            setAccountId(null);
            setTopic(null);
          }
        });

        // Initialize and check for saved pairings
        await hc.init();
        setHashConnect(hc);

        // The pairingEvent will fire automatically if there are saved pairings
        // We don't need to manually check for them

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize HashConnect:', err);
        setError('Failed to initialize wallet connection. Please refresh the page.');
        setLoading(false);
      }
    })();
  }, []);

  // --- Connect to Wallet ---
  const connect = useCallback(async () => {
    if (!hashConnect) {
      setError('HashConnect not initialized.');
      return;
    }

    try {
      setError(null);
      // Open pairing modal
      await hashConnect.openPairingModal();
      
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
    }
  }, [hashConnect]);

  // --- Disconnect ---
  // In WalletContext.tsx

  const disconnect = useCallback(async () => {
    // Let's add this log to inspect the object and see all available methods
    console.log('Inspecting hashConnect object:', hashConnect);

    if (!hashConnect) return;

    // Disconnect from the active topic
    if (topic) {
        try {
            await hashConnect.disconnect(topic);
        } catch (err) {
            console.error('Error during hashConnect.disconnect:', err);
        }
    }
    
    // THE REAL FIX: Manually remove the saved data from the browser's storage.
    localStorage.removeItem('hashconnect-data');
    
    // Immediately reset the state to reflect the disconnection
    setAccountId(null);
    setTopic(null);
    setError(null);
    console.log('Wallet disconnected and session wiped from localStorage.');

}, [hashConnect, topic]);

  // --- Execute Transaction ---
  const executeTransaction = useCallback(
    async (tx: Transaction) => {
      if (!hashConnect || !accountId) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      try {
        // Get the signer using the simplified API
        const acctId = AccountId.fromString(accountId);
        const signer = hashConnect.getSigner(acctId);

        // Freeze the transaction with the signer
        const frozenTx = await tx.freezeWithSigner(signer);
        
        // Execute the transaction - this will prompt the wallet for signing
        const response = await frozenTx.executeWithSigner(signer);
        
        console.log('Transaction executed:', response.transactionId.toString());
        
        return response;
      } catch (err: any) {
        console.error('Transaction failed:', err);
        
        // Check for user rejection
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
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

  // --- Initialize HashConnect v3 ---
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { HashConnect, HashConnectConnectionState } = await import('hashconnect');

        const appMetadata = {
          name: 'Project Agbejo',
          description: 'A decentralized escrow and dispute resolution service on Hedera.',
          icons: ['https://www.hashpack.app/img/logo.svg'],
          url: typeof window !== 'undefined' ? window.location.origin : '',
        };

        const projectId = process.env.NEXT_PUBLIC_HASHCONNECT_PROJECT_ID || 'e5633dd36d915a6c8d2d7785951b4a6d';

        const hc = new HashConnect(
          LedgerId.TESTNET,
          projectId,
          appMetadata,
          true // debug
        );

        // --- Event Listeners ---
        hc.pairingEvent.on((pairingData: any) => {
          console.log('[HashConnect] New pairing event:', pairingData);
          if (pairingData.accountIds && pairingData.accountIds.length > 0) {
            setAccountId(pairingData.accountIds[0]);
            setTopic(pairingData.topic);
          }
        });

        hc.connectionStatusChangeEvent.on((state: any) => {
          console.log('[HashConnect] Connection status changed:', state);
          if (state === HashConnectConnectionState.Disconnected) {
            setAccountId(null);
            setTopic(null);
          }
        });

        // --- Initialization ---
        // init() restores existing sessions from localStorage automatically
        await hc.init();

        // After init, check if we recovered an existing pairing
        const hcAny = hc as any;
        if (hcAny.pairingData && hcAny.pairingData.length > 0) {
          const lastPairing = hcAny.pairingData[hcAny.pairingData.length - 1];
          if (lastPairing.accountIds && lastPairing.accountIds.length > 0) {
            console.log('[HashConnect] Session restored for account:', lastPairing.accountIds[0]);
            setAccountId(lastPairing.accountIds[0]);
            setTopic(lastPairing.topic);
          }
        }

        if (isMounted) {
          setHashConnect(hc);
          setLoading(false);
        }
      } catch (err) {
        console.error('[HashConnect] Initialization failed:', err);
        if (isMounted) {
          setError('Failed to initialize wallet connection.');
          setLoading(false);
        }
      }
    })();

    return () => { isMounted = false; };
  }, []);

  // --- Connect to Wallet ---
  const connect = useCallback(async () => {
    if (!hashConnect) {
      setError('Wallet system not ready. Please refresh.');
      return;
    }

    try {
      setError(null);
      await hashConnect.openPairingModal();
    } catch (err: any) {
      console.error('Connection failed:', err);
      setError(err.message || 'Failed to open pairing modal.');
    }
  }, [hashConnect]);

  // --- Disconnect ---
  const disconnect = useCallback(async () => {
    if (!hashConnect) return;

    try {
      setLoading(true);
      // Use the topic from state, or try to find it in the instance pairings
      const hcAny = hashConnect as any;
      const activeTopic = topic || (hcAny.pairingData && hcAny.pairingData.length > 0 ? hcAny.pairingData[0].topic : null);

      if (activeTopic) {
        console.log('[HashConnect] Disconnecting from topic:', activeTopic);
        await hashConnect.disconnect(activeTopic);
      }

      setAccountId(null);
      setTopic(null);
      setError(null);
    } catch (err) {
      console.error('Disconnect failed:', err);
      // Even if the network call fails, we clear local state to let the user "try again"
      setAccountId(null);
      setTopic(null);
    } finally {
      setLoading(false);
    }
  }, [hashConnect, topic]);

  // --- Execute Transaction ---
  const executeTransaction = useCallback(
    async (tx: Transaction) => {
      if (!hashConnect || !accountId) {
        throw new Error('Wallet not connected.');
      }

      try {
        setLoading(true);
        const acctId = AccountId.fromString(accountId);
        const signer = hashConnect.getSigner(acctId);

        // Explicitly freeze the transaction with the signer to populate the protobuf data
        const frozenTx = await tx.freezeWithSigner(signer);
        const response = await frozenTx.executeWithSigner(signer);

        setLoading(false);
        return response;
      } catch (err: any) {
        setLoading(false);
        console.error('Transaction failed:', err);
        const msg = err.message || '';
        if (msg.includes('No matching key') || msg.includes('proposal:')) {
          throw new Error('Wallet session expired. Please disconnect and reconnect your wallet.');
        }
        if (msg.includes('User rejected') || msg.includes('rejected')) {
          throw new Error('Transaction rejected in wallet.');
        }
        throw new Error(msg || 'Transaction failed. Please try again.');
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
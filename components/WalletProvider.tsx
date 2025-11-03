'use client';

import { useState, useEffect, ReactNode } from 'react';
import { WalletContext, WalletProviderType } from './WalletContext';

// Dynamically import wallet functions to avoid SSR issues with hashconnect
let walletModule: any = null;
let isLoading = false;

const getWalletModule = async () => {
  if (!walletModule && typeof window !== 'undefined' && !isLoading) {
    try {
      isLoading = true;
      // Use simple dynamic import - Next.js will handle chunking
      walletModule = await import('../lib/wallets');
    } catch (error: any) {
      console.error('Failed to load wallet module:', error);
      
      // If it's a chunk loading error, suggest page reload immediately
      if (error?.message?.includes('chunk') || 
          error?.message?.includes('Loading') ||
          error?.name === 'ChunkLoadError' ||
          error?.isChunkError) {
        throw new Error('Failed to load wallet module. Please refresh the page and try again.');
      }
      
      // Retry once after a short delay for other errors (not chunk errors)
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        walletModule = await import('../lib/wallets');
      } catch (retryError: any) {
        console.error('Retry failed to load wallet module:', retryError);
        if (retryError?.message?.includes('chunk') || retryError?.name === 'ChunkLoadError') {
          throw new Error('Failed to load wallet module. Please refresh the page and try again.');
        }
        throw new Error('Failed to load wallet connection module. Please refresh the page.');
      }
    } finally {
      isLoading = false;
    }
  }
  return walletModule;
};

// Type definitions - actual SDK imports are done dynamically to avoid bundling Node.js modules
type Transaction = any;
type TransactionResponse = any;

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [provider, setProvider] = useState<WalletProviderType>(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async (provider: WalletProviderType) => {
    if (isConnecting) {
      console.log('Connection already in progress...');
      return;
    }

    setIsConnecting(true);
    try {
      if (!provider) throw new Error('Wallet provider not specified');
      
      // Add timeout for module loading
      const loadTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Wallet module loading timeout')), 10000)
      );
      
      const walletMod = await Promise.race([getWalletModule(), loadTimeout]);
      if (!walletMod) {
        throw new Error('Wallet module not available');
      }
      
      console.log(`🔌 Connecting to ${provider}...`);
      const connectionResult = await walletMod.connect(provider);

      console.log('Connection result:', connectionResult);

      if (connectionResult && connectionResult.accountIds && connectionResult.accountIds.length > 0) {
        console.log(`✅ Connected with account: ${connectionResult.accountIds[0]}`);
        setAccountId(connectionResult.accountIds[0]);
        setProvider(provider);
        setConnected(true);
      } else {
        const errorMsg = 'No account selected. Please select an account in your wallet and approve the connection.';
        console.warn(errorMsg);
        alert(`⚠️ ${errorMsg}\n\nMake sure to:\n1. Select an account in HashPack\n2. Approve the connection\n3. Ensure your account is on the correct network (${process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'})`);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error connecting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      
      // Only show alert if it's not a user cancellation or timeout
      if (!errorMessage.includes('timeout') && !errorMessage.includes('cancelled')) {
        alert(`Connection failed: ${errorMessage}`);
      }
      
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    // Fire and forget - module should already be loaded if connected
    getWalletModule().then(walletMod => {
      if (walletMod) {
        walletMod.disconnect();
      }
    }).catch(() => {
      // Ignore errors - module might not be loaded yet
    });
    setAccountId(null);
    setProvider(null);
    setConnected(false);
  };

  const signAndExecuteTransaction = async (transaction: Transaction): Promise<TransactionResponse> => {
    if (!connected || !accountId) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    // Basic validation - check if it's an object with expected methods
    if (!transaction || typeof transaction !== 'object') {
      throw new Error('Invalid transaction object');
    }

    try {
      const walletMod = await getWalletModule();
      if (!walletMod) {
        throw new Error('Wallet module not available');
      }
      return await walletMod.signAndExecuteTransaction(transaction, accountId);
    } catch (error) {
      console.error('Transaction signing error:', error);
      throw error;
    }
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        const walletMod = await getWalletModule();
        if (!walletMod) return;
        
        const hashconnect = walletMod.getHashConnect();
        const pairing = walletMod.getPairingData();
        
        if (hashconnect && pairing && pairing.accountIds && pairing.accountIds.length > 0) {
          console.log('✅ Found existing connection:', pairing.accountIds[0]);
          setAccountId(pairing.accountIds[0]);
          setProvider('hashpack'); // Default to hashpack for existing connections
          setConnected(true);
        }
      } catch (error) {
        console.log('No existing connection found:', error);
      }
    };

    // Only check on client side
    if (typeof window !== 'undefined') {
      checkExistingConnection();
    }
  }, []);

  return (
    <WalletContext.Provider 
      value={{ 
        connected, 
        accountId, 
        provider,
        connect, 
        disconnect,
        signAndExecuteTransaction,
        isConnecting 
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export { useWallet } from './WalletContext';
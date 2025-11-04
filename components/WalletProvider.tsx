'use client';

import { useState, useEffect, ReactNode } from 'react';
import { WalletContext, WalletProviderType } from './WalletContext';

// Dynamically import wallet module to avoid bundling issues during build
// Since WalletProvider is 'use client', this will only load on client side
let walletModule: any = null;
let walletModulePromise: Promise<any> | null = null;

const getWalletModule = async () => {
    if (walletModule) return walletModule;
    
    if (!walletModulePromise) {
        walletModulePromise = import('../lib/wallets');
    }
    
    walletModule = await walletModulePromise;
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
      
      // Ensure we're on the client side
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection can only be initiated on the client side');
      }
      
      // Dynamically load the wallet module
      const walletMod = await getWalletModule();
      
      if (!walletMod) {
        console.error('Wallet module is null or undefined');
        throw new Error('Wallet module not available. Please refresh the page and try again.');
      }
      
      if (!walletMod.connect || typeof walletMod.connect !== 'function') {
        console.error('Wallet module missing connect function:', {
          hasConnect: !!walletMod.connect,
          connectType: typeof walletMod.connect,
          availableKeys: Object.keys(walletMod)
        });
        throw new Error('Wallet module is missing the connect function. Please refresh the page.');
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

  const disconnect = async () => {
    try {
      const walletMod = await getWalletModule();
      if (walletMod) {
        walletMod.disconnect();
      }
    } catch (error) {
      // Ignore errors during disconnect
    }
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
      // Only run on client
      if (typeof window === 'undefined') return;
      
      try {
        // Dynamically load the wallet module
        const walletMod = await getWalletModule();
        
        if (walletMod) {
          // Check for existing connection
          const hashconnect = walletMod.getHashConnect();
          const pairing = walletMod.getPairingData();
          
          if (hashconnect && pairing && pairing.accountIds && pairing.accountIds.length > 0) {
            console.log('✅ Found existing connection:', pairing.accountIds[0]);
            setAccountId(pairing.accountIds[0]);
            setProvider('hashpack'); // Default to hashpack for existing connections
            setConnected(true);
          }
        }
      } catch (error) {
        console.log('Checking for existing connection failed (this is OK if wallet not connected yet):', error);
        // Don't show error to user - this is just a check
      }
    };

    checkExistingConnection();
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
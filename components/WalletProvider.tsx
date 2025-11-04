'use client';

import { useState, useEffect, ReactNode } from 'react';
import { WalletContext, WalletProviderType } from './WalletContext';

// Dynamically import wallet functions to avoid SSR issues with hashconnect
// Even though this component is wrapped by WalletLoader with ssr: false,
// we still use dynamic imports to avoid chunk loading issues
let walletModule: any = null;
let isLoading = false;

const getWalletModule = async () => {
  // Return cached module if available
  if (walletModule) {
    return walletModule;
  }
  
  // Only load on client side
  if (typeof window === 'undefined') {
    console.warn('getWalletModule called on server side');
    return null;
  }
  
  // Prevent concurrent loads
  if (isLoading) {
    // Wait for existing load to complete
    let attempts = 0;
    while (isLoading && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (walletModule) return walletModule;
    }
    return null;
  }
  
  try {
    isLoading = true;
    console.log('Loading wallet module...');
    // Use webpack magic comment to ensure wallets and hashconnect load together
    const walletModuleImport = await import(
      /* webpackChunkName: "wallet-modules" */
      '../lib/wallets'
    );
    
    // lib/wallets.ts uses named exports, not default export
    // Verify module has required exports
    if (!walletModuleImport || !walletModuleImport.connect) {
      console.error('Wallet module loaded but missing exports:', Object.keys(walletModuleImport || {}));
      throw new Error('Wallet module missing required exports');
    }
    
    // Use the imported module directly (it has named exports)
    walletModule = walletModuleImport;
    
    // Verify connect function exists
    if (!walletModule.connect || typeof walletModule.connect !== 'function') {
      console.error('Wallet module missing connect function:', walletModule);
      throw new Error('Wallet module missing connect function');
    }
    
    console.log('✅ Wallet module loaded successfully');
    console.log('Available exports:', Object.keys(walletModule));
    return walletModule;
  } catch (error: any) {
    console.error('❌ Failed to load wallet module:', error);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    
    // Don't retry chunk loading errors
    if (error?.message?.includes('chunk') || 
        error?.message?.includes('Loading') ||
        error?.name === 'ChunkLoadError') {
      throw new Error('Failed to load wallet module. Please refresh the page and try again.');
    }
    
    // Retry once for other errors
    try {
      console.log('Retrying wallet module load...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const walletModuleImport = await import(
        /* webpackChunkName: "wallet-modules" */
        '../lib/wallets'
      );
      walletModule = walletModuleImport;
      
      if (!walletModule || !walletModule.connect) {
        throw new Error('Retry failed: module missing exports');
      }
      
      console.log('✅ Wallet module loaded on retry');
      return walletModule;
    } catch (retryError: any) {
      console.error('❌ Retry failed to load wallet module:', retryError);
      throw new Error('Failed to load wallet connection module. Please refresh the page.');
    }
  } finally {
    isLoading = false;
  }
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
      
      console.log('Loading wallet module...');
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

  // Preload wallet module on mount and check for existing connection
  useEffect(() => {
    const preloadWalletModule = async () => {
      // Only run on client
      if (typeof window === 'undefined') return;
      
      try {
        // Preload the module so it's ready when user clicks connect
        console.log('Preloading wallet module...');
        const walletMod = await getWalletModule();
        
        if (walletMod) {
          console.log('✅ Wallet module preloaded successfully');
          
          // Check for existing connection
          const hashconnect = walletMod.getHashConnect();
          const pairing = walletMod.getPairingData();
          
          if (hashconnect && pairing && pairing.accountIds && pairing.accountIds.length > 0) {
            console.log('✅ Found existing connection:', pairing.accountIds[0]);
            setAccountId(pairing.accountIds[0]);
            setProvider('hashpack'); // Default to hashpack for existing connections
            setConnected(true);
          }
        } else {
          console.warn('⚠️ Wallet module preload returned null');
        }
      } catch (error) {
        console.log('Wallet module preload failed (this is OK if wallet not connected yet):', error);
        // Don't show error to user - this is just a preload attempt
      }
    };

    preloadWalletModule();
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
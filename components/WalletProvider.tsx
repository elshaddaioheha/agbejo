'use client';

import { ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // Preload wallet modules early and clean up stale WalletConnect data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clean up stale WalletConnect localStorage data on mount
      // This prevents "No matching key" errors from expired pairing sessions
      try {
        const keys = Object.keys(localStorage);
        const staleKeys: string[] = [];
        
        keys.forEach(key => {
          // Check for WalletConnect-related keys
          if (key.includes('wc@') || key.includes('walletconnect') || key.includes('WCM')) {
            try {
              const value = localStorage.getItem(key);
              // Check if it's expired data (contains topic or expirer references)
              if (value && (value.includes('expirer') || value.includes('topic:'))) {
                staleKeys.push(key);
              }
            } catch (e) {
              // Ignore individual read errors
            }
          }
        });
        
        // Remove stale keys
        staleKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore removal errors
          }
        });
        
        if (staleKeys.length > 0) {
          console.debug(`Cleared ${staleKeys.length} stale WalletConnect entries`);
        }
      } catch (e) {
        // Ignore localStorage cleanup errors
      }

      // Preload wallet dependencies to ensure they're in the same chunk
      // This prevents chunk loading errors by ensuring modules are loaded before use
      Promise.all([
        import(/* webpackChunkName: "wallet-modules" */ 'hashconnect'),
        import(/* webpackChunkName: "wallet-modules" */ '@hashgraph/sdk')
      ]).catch((error) => {
        // Silently fail - modules will be loaded when needed
        console.debug('Preloading wallet modules:', error);
      });
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
};

// Re-export useWallet for backward compatibility
export { useWallet } from './WalletContext';

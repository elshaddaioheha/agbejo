'use client';

import { ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // Preload wallet modules early to ensure consistent chunk loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Preload wallet dependencies to ensure they're in the same chunk
      // This prevents chunk loading errors by ensuring modules are loaded before use
      Promise.all([
        import(/* webpackChunkName: "wallet-modules" */ 'hashconnect'),
        import(/* webpackChunkName: "wallet-modules" */ '@hashgraph/sdk')
      ]).catch((error) => {
        // Silently fail - modules will be loaded when needed
        console.log('Preloading wallet modules:', error);
      });
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
};

// Re-export useWallet for backward compatibility
export { useWallet } from './WalletContext';

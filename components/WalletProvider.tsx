'use client';

import { ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { checkExistingConnection } from '@/store/walletSlice';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // Check for existing connection on mount
    store.dispatch(checkExistingConnection());
  }, []);

  return <Provider store={store}>{children}</Provider>;
};

// Re-export useWallet for backward compatibility
export { useWallet } from './WalletContext';

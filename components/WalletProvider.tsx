'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // The useHashConnect hook handles checking existing connections
  // No need to dispatch here - it's done in the hook
  return <Provider store={store}>{children}</Provider>;
};

// Re-export useWallet for backward compatibility
export { useWallet } from './WalletContext';

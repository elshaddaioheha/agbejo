'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import WalletProvider with SSR disabled
// This ensures hashconnect is never loaded during SSR
const WalletProviderDynamic = dynamic(
  () => import('./WalletProvider').then(mod => ({ default: mod.WalletProvider })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
        </div>
      </div>
    )
  }
);

export function WalletLoader({ children }: { children: ReactNode }) {
  return <WalletProviderDynamic>{children}</WalletProviderDynamic>;
}


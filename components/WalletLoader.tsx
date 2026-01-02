'use client';

import { ReactNode } from 'react';
import { WalletProvider } from './WalletProvider';

// Import WalletProvider directly since it's already marked 'use client'
// This avoids Next.js dynamic() which creates its own chunk
// The WalletProvider itself handles dynamic imports of wallet modules
export function WalletLoader({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}


'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the WalletProvider with SSR turned off
const WalletProvider = dynamic(
  () => import('@/context/WalletContext').then((mod) => mod.WalletProvider),
  {
    ssr: false,
    // Optional: You can add a loading component here if you want
    loading: () => <p>Loading Wallet...</p>, 
  }
);

// This is a Client Component that wraps the dynamically imported provider
export function ClientWalletProvider({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}

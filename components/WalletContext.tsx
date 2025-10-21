'use client';

import { createContext } from 'react';
import { Client } from '@hashgraph/sdk';

export interface WalletContextType {
  account: string | null;
  provider: Client | null;
}

export const WalletContext = createContext<WalletContextType>({
  account: null,
  provider: null,
});

export const useWallet = () => useContext(WalletContext);

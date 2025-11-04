'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch } from './store';

// Types - will be dynamically imported
type HashConnect = any;
type HashConnectTypes = any;
type LedgerId = any;

export type WalletProviderType = 'hashpack' | 'blade' | null;

interface WalletState {
  connected: boolean;
  accountId: string | null;
  provider: WalletProviderType;
  isConnecting: boolean;
  hashconnect: HashConnect | null;
  pairingData: any | null; // SavedPairingData type
  error: string | null;
}

const initialState: WalletState = {
  connected: false,
  accountId: null,
  provider: null,
  isConnecting: false,
  hashconnect: null,
  pairingData: null,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
    },
    setConnected: (state, action: PayloadAction<{ accountId: string; provider: WalletProviderType }>) => {
      state.connected = true;
      state.accountId = action.payload.accountId;
      state.provider = action.payload.provider;
      state.isConnecting = false;
      state.error = null;
    },
    setDisconnected: (state) => {
      state.connected = false;
      state.accountId = null;
      state.provider = null;
      state.isConnecting = false;
      state.pairingData = null;
    },
    setHashConnect: (state, action: PayloadAction<HashConnect | null>) => {
      state.hashconnect = action.payload;
    },
    setPairingData: (state, action: PayloadAction<any | null>) => {
      state.pairingData = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isConnecting = false;
    },
  },
});

export const { setConnecting, setConnected, setDisconnected, setHashConnect, setPairingData, setError } = walletSlice.actions;

// Thunks for async operations
export const connectWallet = (provider: WalletProviderType) => async (dispatch: AppDispatch) => {
  if (typeof window === 'undefined') {
    dispatch(setError('Wallet connection can only be initiated on the client side'));
    return;
  }

  dispatch(setConnecting(true));
  dispatch(setError(null));

  try {
    // Dynamically import wallet dependencies
    const [hashconnectModule, sdkModule] = await Promise.all([
      import('hashconnect'),
      import('@hashgraph/sdk')
    ]);

    const HashConnect = hashconnectModule.HashConnect || 
                       hashconnectModule.default?.HashConnect ||
                       hashconnectModule.default;
    const LedgerId = sdkModule.LedgerId;

    // Get network configuration
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    
    if (!projectId || projectId === 'your_walletconnect_project_id_here') {
      throw new Error('WalletConnect Project ID not configured');
    }

    // Get LedgerId
    let ledgerId: any;
    switch (network) {
      case 'mainnet':
        ledgerId = LedgerId.MAINNET;
        break;
      case 'previewnet':
        ledgerId = LedgerId.PREVIEWNET;
        break;
      default:
        ledgerId = LedgerId.TESTNET;
    }

    // Create app metadata
    const appMetadata: any = {
      name: 'Agbejo',
      description: 'A decentralized escrow application',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.ico`],
    };

    // Initialize HashConnect
    const hashconnect = new HashConnect(ledgerId, projectId, appMetadata, true);
    dispatch(setHashConnect(hashconnect));

    // Initialize and wait for pairing
    await (hashconnect as any).init();

    // Check if already connected
    const existingAccounts = (hashconnect as any).connectedAccountIds;
    if (existingAccounts && existingAccounts.length > 0) {
      const accountId = existingAccounts[0].toString();
      const savedPairings = (hashconnect as any).pairingData;
      const pairing = savedPairings && savedPairings.length > 0 ? savedPairings[0] : null;
      
      dispatch(setPairingData(pairing || null));
      dispatch(setConnected({ accountId, provider: 'hashpack' }));
      return;
    }

    // Open pairing modal
    (hashconnect as any).openPairingModal();

    // Set up event listeners
        const pairingHandler = (data: any) => {
      const accountIds = data.accountIds || [];
      if (accountIds.length > 0) {
        const accountId = accountIds[0];
        const savedPairings = (hashconnect as any).pairingData;
        const pairing = savedPairings && savedPairings.length > 0 ? savedPairings[0] : null;
        
        dispatch(setPairingData(pairing || null));
        dispatch(setConnected({ accountId, provider: 'hashpack' }));
        (hashconnect as any).pairingEvent.off(pairingHandler);
      }
    };

    (hashconnect as any).pairingEvent.on(pairingHandler);

    // Set timeout
    setTimeout(() => {
      if (!(hashconnect as any).connectedAccountIds || (hashconnect as any).connectedAccountIds.length === 0) {
        (hashconnect as any).pairingEvent.off(pairingHandler);
        dispatch(setError('Pairing timeout - please select an account in HashPack and try again'));
      }
    }, 300000); // 5 minutes

  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    dispatch(setError(error.message || 'Connection failed'));
  }
};

export const disconnectWallet = () => async (dispatch: AppDispatch, getState: () => any) => {
  const state = getState();
  const hashconnect = state.wallet.hashconnect;

  if (hashconnect) {
    try {
      (hashconnect as any).disconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  dispatch(setDisconnected());
  dispatch(setHashConnect(null));
};

export const checkExistingConnection = () => async (dispatch: AppDispatch) => {
  if (typeof window === 'undefined') return;

  try {
    // Dynamically import wallet dependencies
    const [hashconnectModule, sdkModule] = await Promise.all([
      import('hashconnect'),
      import('@hashgraph/sdk')
    ]);

    const HashConnect = hashconnectModule.HashConnect || 
                       hashconnectModule.default?.HashConnect ||
                       hashconnectModule.default;
    const LedgerId = sdkModule.LedgerId;

    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    
    if (!projectId) return;

    let ledgerId: any;
    switch (network) {
      case 'mainnet':
        ledgerId = LedgerId.MAINNET;
        break;
      case 'previewnet':
        ledgerId = LedgerId.PREVIEWNET;
        break;
      default:
        ledgerId = LedgerId.TESTNET;
    }

    const appMetadata: any = {
      name: 'Agbejo',
      description: 'A decentralized escrow application',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.ico`],
    };

    const hashconnect = new HashConnect(ledgerId, projectId, appMetadata, true);
    await (hashconnect as any).init();

    const existingAccounts = (hashconnect as any).connectedAccountIds;
    if (existingAccounts && existingAccounts.length > 0) {
      const accountId = existingAccounts[0].toString();
      const savedPairings = (hashconnect as any).pairingData;
      const pairing = savedPairings && savedPairings.length > 0 ? savedPairings[0] : null;
      
      dispatch(setHashConnect(hashconnect));
      dispatch(setPairingData(pairing || null));
      dispatch(setConnected({ accountId, provider: 'hashpack' }));
    }
  } catch (error) {
    console.log('Checking for existing connection failed:', error);
    // Don't set error - this is just a check
  }
};

export default walletSlice.reducer;


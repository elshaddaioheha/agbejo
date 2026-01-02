'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface HashConnectState {
  accountId: string | null;
  isConnected: boolean;
  network: 'testnet' | 'mainnet' | 'previewnet';
  pairingData: any | null;
  isConnecting: boolean;
  error: string | null;
}

const initialState: HashConnectState = {
  accountId: null,
  isConnected: false,
  network: (process.env.NEXT_PUBLIC_HEDERA_NETWORK as 'testnet' | 'mainnet' | 'previewnet') || 'testnet',
  pairingData: null,
  isConnecting: false,
  error: null,
};

const hashconnectSlice = createSlice({
  name: 'hashconnect',
  initialState,
  reducers: {
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
      state.error = null;
    },
    setConnected: (state, action: PayloadAction<{ accountId: string; pairingData: any }>) => {
      state.accountId = action.payload.accountId;
      state.isConnected = true;
      state.pairingData = action.payload.pairingData;
      state.isConnecting = false;
      state.error = null;
    },
    setDisconnected: (state) => {
      state.accountId = null;
      state.isConnected = false;
      state.pairingData = null;
      state.isConnecting = false;
      state.error = null;
    },
    setNetwork: (state, action: PayloadAction<'testnet' | 'mainnet' | 'previewnet'>) => {
      state.network = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isConnecting = false;
    },
    setPairingData: (state, action: PayloadAction<any | null>) => {
      state.pairingData = action.payload;
    },
  },
});

export const {
  setConnecting,
  setConnected,
  setDisconnected,
  setNetwork,
  setError,
  setPairingData,
} = hashconnectSlice.actions;

export default hashconnectSlice.reducer;


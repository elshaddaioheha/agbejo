'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  setConnecting,
  setConnected,
  setDisconnected,
  setError,
  setPairingData,
} from '@/store/hashconnectSlice';
import { getHashConnect } from '@/lib/hashconnect';

export const useHashConnect = () => {
  const dispatch = useAppDispatch();
  const { accountId, isConnected, network, pairingData, isConnecting, error } = useAppSelector(
    (state) => state.hashconnect
  );

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Get the initialized instance
        const hashconnect = await getHashConnect();
        if (!hashconnect) return;

        // ***FIX: No need to call .init() here, it's already done by the singleton***

        const existingAccounts = (hashconnect as any).connectedAccountIds;
        if (existingAccounts && existingAccounts.length > 0) {
          const accountId = existingAccounts[0].toString();
          const savedPairings = (hashconnect as any).pairingData;
          const pairing = savedPairings && savedPairings.length > 0 ? savedPairings[0] : null;

          dispatch(setPairingData(pairing));
          dispatch(setConnected({ accountId, pairingData: pairing }));
        }
      } catch (error) {
        console.log('Checking for existing connection failed:', error);
        // Don't set error - this is just a check
      }
    };

    checkExistingConnection();
  }, [dispatch]);

  const connect = async () => {
    if (typeof window === 'undefined') {
      dispatch(setError('Wallet connection can only be initiated on the client side'));
      return;
    }

    if (isConnecting) {
      console.log('Connection already in progress...');
      return;
    }

    dispatch(setConnecting(true));
    dispatch(setError(null));

    try {
      // Get the singleton instance (which is already initialized)
      const hashconnect = await getHashConnect();
      if (!hashconnect) {
        throw new Error('HashConnect failed to initialize');
      }

      // ***FIX: Removed the .init() call from here***

      // Check if already connected
      const existingAccounts = (hashconnect as any).connectedAccountIds;
      if (existingAccounts && existingAccounts.length > 0) {
        const accountId = existingAccounts[0].toString();
        const savedPairings = (hashconnect as any).pairingData;
        const pairing = savedPairings && savedPairings.length > 0 ? savedPairings[0] : null;

        dispatch(setPairingData(pairing));
        dispatch(setConnected({ accountId, pairingData: pairing }));
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

          dispatch(setPairingData(pairing));
          dispatch(setConnected({ accountId, pairingData: pairing }));
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

      // ***FIX: Removed the entire fallback logic that created a new instance***

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      dispatch(setError(error.message || 'Connection failed'));
    }
  };

  const disconnect = async () => {
    try {
      const hashconnect = await getHashConnect();
      if (hashconnect) {
        (hashconnect as any).disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }

    dispatch(setDisconnected());
  };

  return {
    accountId,
    isConnected,
    network,
    pairingData,
    isConnecting,
    error,
    connect,
    disconnect,
  };
};
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

        // Wait a bit for HashConnect to fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check for existing accounts safely
        try {
          const existingAccounts = (hashconnect as any).connectedAccountIds;
          if (existingAccounts && Array.isArray(existingAccounts) && existingAccounts.length > 0) {
            const accountId = existingAccounts[0].toString();
            const savedPairings = (hashconnect as any).pairingData;
            const pairing = savedPairings && Array.isArray(savedPairings) && savedPairings.length > 0 
              ? savedPairings[0] 
              : null;

            if (accountId) {
              dispatch(setPairingData(pairing));
              dispatch(setConnected({ accountId, pairingData: pairing }));
            }
          }
        } catch (accountError) {
          // Ignore errors accessing account data - might not be connected yet
          console.log('No existing connection found (this is normal)');
        }
      } catch (error) {
        // Silently handle - this is just a check, not critical
        console.log('Checking for existing connection:', error instanceof Error ? error.message : 'Unknown error');
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
      
      // Small delay to ensure HashConnect is fully ready
      await new Promise(resolve => setTimeout(resolve, 200));

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

      // Wait a moment for HashConnect to be fully ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Set up event listeners BEFORE opening modal
      const pairingHandler = (data: any) => {
        const accountIds = data.accountIds || [];
        if (accountIds.length > 0) {
          const accountId = accountIds[0];
          const savedPairings = (hashconnect as any).pairingData;
          const pairing = savedPairings && savedPairings.length > 0 ? savedPairings[0] : null;

          dispatch(setPairingData(pairing));
          dispatch(setConnected({ accountId, pairingData: pairing }));
          (hashconnect as any).pairingEvent?.off(pairingHandler);
        }
      };

      (hashconnect as any).pairingEvent?.on(pairingHandler);

      // Open pairing modal with error handling
      try {
        (hashconnect as any).openPairingModal();
      } catch (modalError: any) {
        // If URI is missing, wait a bit and retry
        if (modalError?.message?.includes('URI') || modalError?.message?.includes('Missing')) {
          console.debug('Waiting for pairing URI...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            (hashconnect as any).openPairingModal();
          } catch (retryError) {
            console.error('Failed to open pairing modal after retry:', retryError);
            dispatch(setError('Failed to open wallet connection. Please refresh and try again.'));
            (hashconnect as any).pairingEvent?.off(pairingHandler);
            return;
          }
        } else {
          throw modalError;
        }
      }

      // Set timeout
      setTimeout(() => {
        if (!(hashconnect as any).connectedAccountIds || (hashconnect as any).connectedAccountIds.length === 0) {
          (hashconnect as any).pairingEvent?.off(pairingHandler);
          dispatch(setError('Pairing timeout - please select an account in HashPack and try again'));
          dispatch(setConnecting(false));
        }
      }, 300000); // 5 minutes

      // ***FIX: Removed the entire fallback logic that created a new instance***

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      // Handle specific errors gracefully
      if (error?.message?.includes('URI Missing') || error?.message?.includes('URI')) {
        dispatch(setError('Wallet connection is initializing. Please try again in a moment.'));
      } else {
        dispatch(setError(error.message || 'Connection failed'));
      }
      
      dispatch(setConnecting(false));
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
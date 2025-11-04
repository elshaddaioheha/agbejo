'use client';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { connectWallet, disconnectWallet } from '@/store/walletSlice';

// Type - will be dynamically imported
type TransactionResponse = any;

export type WalletProviderType = 'hashpack' | 'blade' | null;

export interface WalletContextType {
  connected: boolean;
  accountId: string | null;
  provider: WalletProviderType;
  isConnecting: boolean;
  connect: (provider: WalletProviderType) => Promise<void>;
  disconnect: () => void;
  signAndExecuteTransaction: (transaction: any) => Promise<TransactionResponse>;
}

export const useWallet = (): WalletContextType => {
  const dispatch = useAppDispatch();
  const { connected, accountId, provider, isConnecting, hashconnect, pairingData } = useAppSelector(
    (state) => state.wallet
  );

  const connect = async (provider: WalletProviderType) => {
    await dispatch(connectWallet(provider));
  };

  const disconnect = () => {
    dispatch(disconnectWallet());
  };

  const signAndExecuteTransaction = async (transaction: any): Promise<TransactionResponse> => {
    if (!connected || !accountId) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    if (!hashconnect) {
      throw new Error('HashConnect not initialized. Please connect your wallet first.');
    }

    if (!pairingData || !pairingData.topic) {
      throw new Error('No active wallet pairing. Please reconnect your wallet.');
    }

    try {
      // Freeze the transaction
      const frozenTransaction = await transaction.freeze();
      const transactionBytes = frozenTransaction.toBytes();

      // Send transaction to wallet for signing
      await (hashconnect as any).sendTransaction(pairingData.topic, {
        byteArray: Array.from(transactionBytes),
        metadata: {
          accountToSign: accountId,
          returnTransaction: false,
        },
      } as any);

      // Wait for the response via event listener
      return new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          (hashconnect as any).transactionResponseEvent?.off(handler);
          reject(new Error('Transaction timeout - no response from wallet after 60 seconds'));
        }, 60000);

        const handler = async (transactionResponse: any) => {
          clearTimeout(timeoutId);
          (hashconnect as any).transactionResponseEvent?.off(handler);

          if (transactionResponse.success && transactionResponse.responseBytes) {
            try {
              // Dynamically import SDK to parse transaction response
              const sdkModule = await import('@hashgraph/sdk');
              const TxResponse = sdkModule.TransactionResponse as any;
              const responseBytes = new Uint8Array(transactionResponse.responseBytes);
              const txResponse = TxResponse.fromBytes(responseBytes);
              resolve(txResponse);
            } catch (parseError) {
              console.error('Error parsing transaction response:', parseError);
              reject(new Error('Failed to parse transaction response'));
            }
          } else {
            const errorMsg =
              transactionResponse.error || transactionResponse.message || 'Transaction was rejected or failed';
            reject(new Error(errorMsg));
          }
        };

        (hashconnect as any).transactionResponseEvent?.on(handler);
      });
    } catch (error) {
      throw error;
    }
  };

  return {
    connected,
    accountId,
    provider,
    isConnecting,
    connect,
    disconnect,
    signAndExecuteTransaction,
  };
};

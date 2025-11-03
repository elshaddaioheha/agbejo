import { HashConnect } from 'hashconnect';
import { LedgerId, Transaction, TransactionResponse } from '@hashgraph/sdk';

let hashconnect: HashConnect | null = null;
let pairingData: any = null;

const appMetadata = {
    name: "Agbejo",
    description: "A decentralized escrow application",
    url: typeof window !== 'undefined' ? window.location.origin : "https://agbejo.app",
    icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : "https://agbejo.app/favicon.ico"]
};

// Get WalletConnect project ID from environment variable
// Note: For Next.js, public env vars are available on both client and server
const getWalletConnectProjectId = (): string => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    
    if (!projectId || projectId === "your_walletconnect_project_id_here" || projectId === "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID") {
        console.warn('⚠️  WalletConnect Project ID not configured. Please set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your .env file.');
        console.warn('   Get your Project ID from: https://cloud.walletconnect.com/');
        // Return a placeholder - wallet connections will fail but app won't crash
        return "demo-project-id-placeholder";
    }
    
    return projectId;
};

// Determine network from environment
const getNetwork = (): LedgerId => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    switch (network) {
        case 'mainnet':
            return LedgerId.MAINNET;
        case 'previewnet':
            return LedgerId.PREVIEWNET;
        default:
            return LedgerId.TESTNET;
    }
};

export const connect = async (wallet: 'hashpack' | 'blade'): Promise<{ accountIds: string[] }> => {
    const projectId = getWalletConnectProjectId();
    const network = getNetwork();
    
    hashconnect = new HashConnect(network, projectId, appMetadata, true);

    return new Promise(async (resolve, reject) => {
        if (!hashconnect) {
            reject(new Error('Failed to initialize HashConnect'));
            return;
        }

        // Set up pairing event listener
        hashconnect.pairingEvent.on((data) => {
            console.log("Paired with:", data.accountIds);
            pairingData = data;
            resolve({
                accountIds: data.accountIds,
            });
        });

        // Set up connection status event
        hashconnect.connectionStatusChangeEvent.on((connectionStatus) => {
            console.log("Connection status:", connectionStatus);
        });

        try {
            await hashconnect.init();
            
            // Check for existing pairings first
            const savedPairings = hashconnect.getPairings();
            if (savedPairings && savedPairings.length > 0) {
                // Use existing pairing
                const existingPairing = savedPairings[0];
                pairingData = {
                    topic: existingPairing.topic,
                    accountIds: existingPairing.accountIds || [],
                };
                resolve({
                    accountIds: existingPairing.accountIds || [],
                });
            } else {
                // No existing pairing, open modal for new connection
                hashconnect.openPairingModal();
            }
        } catch (error) {
            console.error('Error initializing HashConnect:', error);
            reject(error);
        }
    });
};

export const disconnect = () => {
    if (hashconnect) {
        hashconnect.disconnect();
    }
    hashconnect = null;
    pairingData = null;
};

export const getHashConnect = (): HashConnect | null => {
    return hashconnect;
};

export const getPairingData = () => {
    return pairingData;
};

export const signAndExecuteTransaction = async (
    transaction: Transaction,
    accountId: string
): Promise<TransactionResponse> => {
    if (!hashconnect) {
        throw new Error('HashConnect not initialized. Please connect your wallet first.');
    }

    if (!pairingData || !pairingData.topic) {
        throw new Error('No active wallet pairing. Please reconnect your wallet.');
    }

    // Create a client for the transaction
    const network = getNetwork();
    const { Client } = require('@hashgraph/sdk');
    let client;
    
    if (network === LedgerId.MAINNET) {
        client = Client.forMainnet();
    } else if (network === LedgerId.PREVIEWNET) {
        client = Client.forPreviewnet();
    } else {
        client = Client.forTestnet();
    }

    try {
        // Freeze the transaction with the client
        const frozenTransaction = await transaction.freezeWith(client);

        // Get the bytes of the frozen transaction
        const transactionBytes = frozenTransaction.toBytes();

        // Send transaction to wallet for signing
        const response = await hashconnect.sendTransaction(
            pairingData.topic,
            {
                topic: pairingData.topic,
                byteArray: Array.from(transactionBytes),
                metadata: {
                    accountToSign: accountId,
                    returnTransaction: false,
                },
            },
            pairingData.accountIds[0]
        );

        // Wait for the response via event listener
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                hashconnect?.transactionResponseEvent.off(handler);
                reject(new Error('Transaction timeout - no response from wallet after 60 seconds'));
            }, 60000);

            const handler = (transactionResponse: any) => {
                clearTimeout(timeoutId);
                hashconnect?.transactionResponseEvent.off(handler);

                if (transactionResponse.success && transactionResponse.responseBytes) {
                    try {
                        // Reconstruct transaction response from bytes
                        const responseBytes = new Uint8Array(transactionResponse.responseBytes);
                        const txResponse = TransactionResponse.fromBytes(responseBytes);
                        resolve(txResponse);
                    } catch (parseError) {
                        console.error('Error parsing transaction response:', parseError);
                        reject(new Error('Failed to parse transaction response'));
                    }
                } else {
                    const errorMsg = transactionResponse.error || transactionResponse.message || 'Transaction was rejected or failed';
                    reject(new Error(errorMsg));
                }
            };

            hashconnect.transactionResponseEvent.on(handler);
        });
    } finally {
        client.close();
    }
};

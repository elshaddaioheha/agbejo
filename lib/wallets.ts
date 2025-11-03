// This module should only be imported on the client side
// All functions check for window before accessing browser APIs

// Dynamically import HashConnect to avoid SSR issues
let HashConnectClass: any = null;

// Type definitions - actual imports are done dynamically to avoid bundling Node.js modules in client
type Transaction = any;
type TransactionResponse = any;

let hashconnect: any = null;
let pairingData: any = null;

// Guard to ensure this module only runs on client
if (typeof window === 'undefined') {
    // On server, provide stub implementations
    // These won't be called during SSR, but we need to export something
}

// Get app metadata - safe for both server and client
const getAppMetadata = () => {
    // Only access window on client side
    if (typeof window === 'undefined') {
        return {
            name: "Agbejo",
            description: "A decentralized escrow application",
            url: "https://agbejo.app",
            icons: ["https://agbejo.app/favicon.ico"]
        };
    }
    
    return {
        name: "Agbejo",
        description: "A decentralized escrow application",
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.ico`]
    };
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
const getNetwork = (): number => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    // These match LedgerId enum values from @hashgraph/sdk
    // 1 = TESTNET, 2 = MAINNET, 3 = PREVIEWNET
    switch (network) {
        case 'mainnet':
            return 2; // LedgerId.MAINNET
        case 'previewnet':
            return 3; // LedgerId.PREVIEWNET
        default:
            return 1; // LedgerId.TESTNET
    }
};

export const connect = async (wallet: 'hashpack' | 'blade'): Promise<{ accountIds: string[] }> => {
    // Only run on client side
    if (typeof window === 'undefined') {
        throw new Error('Wallet connection can only be initiated on the client side');
    }
    
    // Dynamically import HashConnect only on client side
    if (!HashConnectClass) {
        const hashconnectModule = await import('hashconnect');
        HashConnectClass = hashconnectModule.HashConnect;
    }
    
    const projectId = getWalletConnectProjectId();
    const network = getNetwork();
    
    // HashConnect requires LedgerId enum from @hashgraph/sdk
    // We need to dynamically import it since we're in a client component
    let ledgerId: any;
    
    try {
        // Dynamically import LedgerId - this should work now that we've updated next.config.js
        const sdkModule = await import('@hashgraph/sdk');
        
        // LedgerId is exported directly from the module
        const LedgerId = sdkModule.LedgerId;
        
        if (!LedgerId) {
            console.error('SDK module contents:', Object.keys(sdkModule));
            throw new Error('LedgerId not found in @hashgraph/sdk. Available keys: ' + Object.keys(sdkModule).join(', '));
        }
        
        console.log('Imported LedgerId:', LedgerId);
        console.log('LedgerId.TESTNET:', LedgerId.TESTNET);
        console.log('LedgerId type:', typeof LedgerId);
        
        // Map network numeric value to LedgerId enum
        // 1 = TESTNET, 2 = MAINNET, 3 = PREVIEWNET
        switch (network) {
            case 2:
                ledgerId = LedgerId.MAINNET;
                break;
            case 3:
                ledgerId = LedgerId.PREVIEWNET;
                break;
            default:
                ledgerId = LedgerId.TESTNET;
        }
        
        if (!ledgerId) {
            throw new Error(`Failed to get LedgerId for network ${network}. LedgerId.TESTNET: ${LedgerId.TESTNET}`);
        }
        
        console.log('Using LedgerId:', ledgerId, 'for network:', network, 'type:', typeof ledgerId);
    } catch (e) {
        console.error('Failed to import LedgerId from @hashgraph/sdk:', e);
        console.error('Error details:', e);
        throw new Error(`Failed to load Hedera SDK: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Verify ledgerId is valid before creating HashConnect instance
    if (!ledgerId || (typeof ledgerId !== 'number' && typeof ledgerId !== 'object')) {
        throw new Error(`Invalid LedgerId: ${ledgerId}. Network: ${network}`);
    }
    
    console.log('Creating HashConnect with LedgerId:', ledgerId);
    const appMetadata = getAppMetadata();
    hashconnect = new HashConnectClass(ledgerId, projectId, appMetadata, true);

    return new Promise(async (resolve, reject) => {
        if (!hashconnect) {
            reject(new Error('Failed to initialize HashConnect'));
            return;
        }

        let timeoutId: NodeJS.Timeout | null = null;
        let isResolved = false;

        // Set up pairing event listener BEFORE init
        const pairingHandler = (data: any) => {
            if (isResolved) return; // Prevent multiple resolutions
            
            console.log("✅ Pairing event received:", data);
            console.log("Account IDs:", data.accountIds);
            console.log("Topic:", data.topic);
            
            // Wait a bit for accountIds to populate, then check connectedAccountIds
            setTimeout(() => {
                // Check both the event data and connectedAccountIds
                const accountsFromEvent = data.accountIds || [];
                const connectedAccounts = hashconnect?.connectedAccountIds || [];
                
                // Convert AccountId objects to strings if needed
                const allAccountIds = [
                    ...accountsFromEvent,
                    ...connectedAccounts.map((acc: any) => acc?.toString?.() || acc)
                ].filter(Boolean);
                
                const uniqueAccountIds = Array.from(new Set(allAccountIds));
                
                console.log("All account IDs found:", uniqueAccountIds);
                
                if (uniqueAccountIds.length > 0) {
                    pairingData = {
                        ...data,
                        accountIds: uniqueAccountIds,
                        topic: data.topic || hashconnect?.pairingString,
                    };
                    isResolved = true;
                    if (timeoutId) clearTimeout(timeoutId);
                    resolve({
                        accountIds: uniqueAccountIds,
                    });
                } else {
                    console.warn("⚠️ Pairing completed but no account IDs found");
                    console.warn("This might mean:");
                    console.warn("  1. User didn't select an account in HashPack");
                    console.warn("  2. Account is not on the correct network (testnet/mainnet)");
                    console.warn("  3. HashPack needs to be refreshed");
                }
            }, 1000); // Give HashConnect a moment to update connectedAccountIds
        };

        hashconnect.pairingEvent.on(pairingHandler);

        // Set up connection status event
        const statusHandler = (connectionStatus: string) => {
            console.log("Connection status changed:", connectionStatus);
            
            if (connectionStatus === 'Connected' && !isResolved) {
                // Check connected accounts when status changes to Connected
                setTimeout(() => {
                    const connectedAccounts = hashconnect?.connectedAccountIds || [];
                    if (connectedAccounts.length > 0) {
                        const accountIds = connectedAccounts.map((acc: any) => acc?.toString?.() || acc);
                        console.log("✅ Found connected accounts via status change:", accountIds);
                        
                        if (!pairingData) {
                            pairingData = {
                                topic: hashconnect?.pairingString,
                                accountIds: accountIds,
                            };
                        }
                        
                        if (!isResolved && accountIds.length > 0) {
                            isResolved = true;
                            if (timeoutId) clearTimeout(timeoutId);
                            resolve({
                                accountIds: accountIds,
                            });
                        }
                    }
                }, 500);
            }
        };

        hashconnect.connectionStatusChangeEvent.on(statusHandler);

        // Set up disconnection event
        hashconnect.disconnectionEvent.on(() => {
            console.log("Disconnected from wallet");
            pairingData = null;
            isResolved = false;
        });

        try {
            await hashconnect.init();
            
            // Check if already connected after init
            const existingAccounts = hashconnect.connectedAccountIds;
            if (existingAccounts && existingAccounts.length > 0) {
                console.log("✅ Already connected with accounts:", existingAccounts);
                const accountIds = existingAccounts.map((acc: any) => acc?.toString?.() || acc);
                pairingData = {
                    topic: hashconnect.pairingString,
                    accountIds: accountIds,
                };
                isResolved = true;
                resolve({
                    accountIds: accountIds,
                });
                return;
            }

            // Open pairing modal for new connection
            console.log("Opening pairing modal...");
            hashconnect.openPairingModal();
            
            // Set timeout to reject if pairing doesn't happen within 5 minutes
            timeoutId = setTimeout(() => {
                if (!isResolved) {
                    hashconnect.pairingEvent.off(pairingHandler);
                    hashconnect.connectionStatusChangeEvent.off(statusHandler);
                    reject(new Error('Pairing timeout - please select an account in HashPack and try again'));
                }
            }, 300000); // 5 minutes
            
        } catch (error) {
            console.error('Error initializing HashConnect:', error);
            if (timeoutId) clearTimeout(timeoutId);
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

export const getHashConnect = (): any => {
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
    // Note: Client is only used server-side, but we need it here to freeze the transaction
    // We'll use dynamic require to avoid bundling Node.js modules in client
    const network = getNetwork();
    
    // For client-side, we need to freeze without creating a full client
    // The transaction will be frozen by HashConnect on the wallet side

    try {
        // Freeze the transaction (this should work client-side with the SDK)
        // The transaction is already constructed, we just need to serialize it
        const frozenTransaction = await transaction.freeze();

        // Get the bytes of the frozen transaction
        const transactionBytes = frozenTransaction.toBytes();

        // Send transaction to wallet for signing
        const response = await hashconnect.sendTransaction(
            pairingData.topic,
            {
                byteArray: Array.from(transactionBytes),
                metadata: {
                    accountToSign: accountId,
                    returnTransaction: false,
                },
            } as any
        );

        // Wait for the response via event listener
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                (hashconnect as any)?.transactionResponseEvent?.off(handler);
                reject(new Error('Transaction timeout - no response from wallet after 60 seconds'));
            }, 60000);

            const handler = (transactionResponse: any) => {
                clearTimeout(timeoutId);
                (hashconnect as any)?.transactionResponseEvent?.off(handler);

                if (transactionResponse.success && transactionResponse.responseBytes) {
                    try {
                        // Dynamically import SDK to avoid bundling Node.js modules in client
                        const { TransactionResponse: TxResponse } = require('@hashgraph/sdk');
                        const responseBytes = new Uint8Array(transactionResponse.responseBytes);
                        const txResponse = TxResponse.fromBytes(responseBytes);
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

            (hashconnect as any).transactionResponseEvent?.on(handler);
        });
    } catch (error) {
        throw error;
    }
};

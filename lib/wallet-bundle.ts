// Wallet bundle - dynamically imports all wallet dependencies
// Must use dynamic imports to avoid Next.js trying to bundle during static generation
// All imports use the same chunk name to ensure they're in one chunk

let loaded: any = null;
let loadingPromise: Promise<any> | null = null;

export async function loadWalletBundle() {
    if (loaded) return loaded;
    
    // Only load on client side
    if (typeof window === 'undefined') {
        throw new Error('Wallet bundle can only be loaded on the client side');
    }
    
    if (!loadingPromise) {
        loadingPromise = Promise.all([
            import('hashconnect'),
            import('@hashgraph/sdk')
        ]).then(([hashconnectModule, sdkModule]) => {
            const HashConnect = hashconnectModule.HashConnect || 
                              hashconnectModule.default?.HashConnect ||
                              hashconnectModule.default;
            const LedgerId = sdkModule.LedgerId;
            
            loaded = { HashConnect, LedgerId };
            return loaded;
        });
    }
    
    return loadingPromise;
}

export async function getHashConnect() {
    const bundle = await loadWalletBundle();
    return bundle.HashConnect;
}

export async function getLedgerId() {
    const bundle = await loadWalletBundle();
    return bundle.LedgerId;
}


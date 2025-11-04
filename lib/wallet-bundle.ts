// Wallet bundle - dynamically imports all wallet dependencies
// This ensures webpack bundles everything into a single chunk
// Only import this file dynamically to avoid SSR issues

// Use dynamic imports but ensure they're in the same chunk
let loaded: any = null;
let loadingPromise: Promise<any> | null = null;

export async function loadWalletBundle() {
    if (loaded) return loaded;
    
    if (!loadingPromise) {
        loadingPromise = Promise.all([
            import(
                /* webpackChunkName: "wallet-modules" */
                'hashconnect'
            ),
            import(
                /* webpackChunkName: "wallet-modules" */
                '@hashgraph/sdk'
            )
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

// Export a getter that ensures bundle is loaded
export async function getHashConnect() {
    const bundle = await loadWalletBundle();
    return bundle.HashConnect;
}

export async function getLedgerId() {
    const bundle = await loadWalletBundle();
    return bundle.LedgerId;
}


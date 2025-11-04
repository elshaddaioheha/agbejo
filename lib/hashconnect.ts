// HashConnect Singleton Service
// This file creates and exports a single instance of HashConnect
// Prevents server-side execution with typeof window check

let hashconnectInstance: any = null;
let initializationPromise: Promise<any> | null = null;

export const getHashConnect = async (): Promise<any | null> => {
  // Only create instance on client side
  if (typeof window === 'undefined') {
    return null;
  }

  // Return existing instance if already created
  if (hashconnectInstance) {
    return hashconnectInstance;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Get network configuration
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  if (!projectId || projectId === 'your_walletconnect_project_id_here') {
    console.warn('⚠️ WalletConnect Project ID not configured');
    return null;
  }

  // Initialize HashConnect instance
  initializationPromise = (async () => {
    try {
      // Dynamically import dependencies to avoid SSR issues
      // Use webpack chunk name to ensure all wallet deps are in one chunk
      const [hashconnectModule, sdkModule] = await Promise.all([
        import(/* webpackChunkName: "wallet-modules" */ 'hashconnect'),
        import(/* webpackChunkName: "wallet-modules" */ '@hashgraph/sdk'),
      ]);

      const HashConnect = hashconnectModule.HashConnect || 
                         hashconnectModule.default?.HashConnect ||
                         hashconnectModule.default;
      const LedgerId = sdkModule.LedgerId;

      // Get LedgerId based on network
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
      const appMetadata = {
        name: 'Agbejo',
        description: 'A decentralized escrow application',
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.ico`],
      };

      // Create singleton instance
      hashconnectInstance = new HashConnect(ledgerId, projectId, appMetadata, true);
      return hashconnectInstance;
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      initializationPromise = null;
      return null;
    }
  })();

  return initializationPromise;
};

export default getHashConnect;


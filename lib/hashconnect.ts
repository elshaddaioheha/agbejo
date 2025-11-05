// HashConnect Singleton Service
// This file creates and exports a single, INITIALIZED instance of HashConnect
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
  // Hardcoded project ID from .env.local
  const projectId = 'e5633dd36d915a6c8d2d7785951b4a6d';

  // Initialize HashConnect instance
  initializationPromise = (async () => {
    try {
      // Dynamically import dependencies to avoid SSR issues
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

      // Validate project ID
      if (!projectId || projectId.length < 20) {
        console.warn('Invalid or missing WalletConnect Project ID. Using default project ID.');
        // You can set a default project ID here or throw an error
      }

      // Create HashConnect instance with correct constructor signature
      // HashConnect(ledgerId, projectId, appMetadata, debug)
      hashconnectInstance = new HashConnect(ledgerId, projectId, appMetadata, false); // Set debug to false to reduce console noise

      // Initialize the instance with error handling for WalletConnect cleanup errors
      try {
        await hashconnectInstance.init();
      } catch (initError: any) {
        // These errors are from WalletConnect's internal cleanup - they're harmless
        const errorMessage = initError?.message || String(initError);
        
        if (errorMessage.includes('URI Missing') || 
            errorMessage.includes('No matching key') ||
            errorMessage.includes('expirer')) {
          // These are cleanup errors from WalletConnect - safe to ignore
          console.debug('HashConnect: WalletConnect cleanup messages (safe to ignore)');
          
          // Clear stale WalletConnect data from localStorage
          try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.includes('wc@') || key.includes('walletconnect') || key.includes('WCM')) {
                try {
                  localStorage.removeItem(key);
                } catch (e) {
                  // Ignore individual removal errors
                }
              }
            });
          } catch (e) {
            // Ignore localStorage errors
          }
          
          // Try to reinitialize after clearing stale data
          try {
            await hashconnectInstance.init();
          } catch (retryError) {
            // If it still fails, log but don't throw - HashConnect can work without init
            console.warn('HashConnect reinitialization after cleanup:', retryError);
          }
        } else {
          // Other errors are more serious
          throw initError;
        }
      }

      return hashconnectInstance;
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      initializationPromise = null;
      hashconnectInstance = null;
      return null;
    }
  })();

  return initializationPromise;
};

export default getHashConnect;


import { HashConnect } from 'hashconnect';
import { LedgerId } from '@hashgraph/sdk';

let hashconnect: HashConnect | null = null;

const appMetadata = {
    name: "Agbejo",
    description: "A decentralized escrow application",
    url: "https://agbejo.app",
    icons: ["https://agbejo.app/favicon.ico"]
};

// TODO: Replace with your WalletConnect project ID
const NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID";

export const connect = async (wallet: 'hashpack' | 'blade'): Promise<{ accountIds: string[] }> => {
    hashconnect = new HashConnect(LedgerId.TESTNET, NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, appMetadata, true); // enable debug mode

    return new Promise(async (resolve) => {
        if (!hashconnect) {
            return;
        }
        hashconnect.pairingEvent.on((data) => {
            console.log("Paired with:", data.accountIds);
            resolve({
                accountIds: data.accountIds,
            });
        });

        await hashconnect.init();
        hashconnect.openPairingModal();
    });
};

export const disconnect = () => {
    if (hashconnect) {
        hashconnect.disconnect();
        hashconnect = null;
    }
};

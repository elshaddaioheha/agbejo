'use client';

import { useWallet } from '@/context/WalletContext';

const WalletIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>
);

export default function WalletConnect() {
  const { accountId, connect, disconnect, isConnecting, isDisconnecting } = useWallet();

  if (accountId) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <WalletIcon />
          <span className="font-mono text-sm">{accountId}</span>
        </div>
        <button onClick={disconnect} disabled={isDisconnecting} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  return (
    <button onClick={connect} disabled={isConnecting} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

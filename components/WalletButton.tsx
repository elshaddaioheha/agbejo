'use client';

import { useHashConnect } from '@/hooks/useHashConnect';
import { Wallet, Loader2 } from 'lucide-react';

export function WalletButton() {
  const { accountId, isConnected, isConnecting, connect, disconnect } = useHashConnect();

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (isConnected && accountId) {
    return (
      <div className="flex items-center justify-center gap-3">
        {/* Connected Account Badge */}
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-100">
            {truncateAddress(accountId)}
          </span>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/25"
    >
      {isConnecting ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Wallet size={18} />
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}


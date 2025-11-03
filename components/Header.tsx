'use client'

import { useState } from 'react'
import { useWallet } from './WalletContext'
import { Wallet, LogOut, Shield, Loader2 } from 'lucide-react'

export function Header() {
  const { connected, accountId, connect, disconnect, isConnecting } = useWallet()
  const [showWallets, setShowWallets] = useState(false)

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Agbejo
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Secure Escrow
              </p>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="relative">
            {!connected ? (
              <div>
                <button
                  onClick={() => setShowWallets(!showWallets)}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
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
                {showWallets && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={() => { connect('hashpack').catch(console.error); setShowWallets(false); }}
                      disabled={isConnecting}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? 'Connecting...' : 'HashPack'}
                    </button>
                    <button
                      onClick={() => { connect('blade').catch(console.error); setShowWallets(false); }}
                      disabled={isConnecting}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? 'Connecting...' : 'Blade'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Connected Account Badge */}
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {truncateAddress(accountId!)}
                  </span>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Disconnect"
                >
                  <LogOut size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

'use client'

import { useWallet } from './WalletProvider'
import { Wallet, LogOut } from 'lucide-react'

export function Header() {
  const { connected, accountId, connect, disconnect } = useWallet()

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              Project Agbejo
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {!connected ? (
              <button
                onClick={connect}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <Wallet size={20} />
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {accountId ? truncateAddress(accountId) : 'Connected'}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <LogOut size={20} />
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

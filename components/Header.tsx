'use client'

import { useWallet } from './WalletProvider'
import { Wallet, LogOut } from 'lucide-react'

// A simple SVG logo component
function Logo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary-600 dark:text-primary-400"
    >
      <g fill="currentColor">
        <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z M50 15 L85 32.5 L85 67.5 L50 85 L15 67.5 L15 32.5 Z" />
        <path d="M50 25 L75 37.5 V 62.5 L50 75 L25 62.5 V 37.5 Z" />
      </g>
    </svg>
  )
}

export function Header() {
  const { connected, accountId, connect, disconnect } = useWallet()

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Logo />
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
                    {truncateAddress(accountId!)}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

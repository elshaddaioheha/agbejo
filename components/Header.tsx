<<<<<<< HEAD
'use client'

import { useWallet } from './WalletContext'
import { Wallet, LogOut, Shield } from 'lucide-react'

export function Header() {
  const { connected, accountId, connect, disconnect } = useWallet()

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
          <div className="flex items-center gap-3">
            {!connected ? (
              <button
                onClick={connect}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Wallet size={18} />
                <span>Connect Wallet</span>
              </button>
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
=======
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
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec

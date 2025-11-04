'use client'

import dynamic from 'next/dynamic'
import { Shield } from 'lucide-react'
import { WalletButton } from './WalletButton'

// Dynamically import WalletButton to prevent SSR issues
// This is the recommended pattern for Next.js 14 App Router with hashconnect
const DynamicWalletButton = dynamic(() => import('./WalletButton').then(mod => ({ default: mod.WalletButton })), {
  ssr: false,
  loading: () => (
    <div className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-40 h-10"></div>
  ),
});

export function Header() {
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
            <DynamicWalletButton />
          </div>
        </div>
      </nav>
    </header>
  )
}

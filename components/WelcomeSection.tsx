'use client'

import { Shield, Users, Lock } from 'lucide-react'
import { useWallet } from './WalletProvider'

export function WelcomeSection() {
  const { connect } = useWallet()

  return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
        Welcome to Project Agbejo
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
        A secure, decentralized escrow service. Please connect your wallet to view or create deals.
      </p>

      <button
        onClick={connect}
        className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg rounded-lg font-medium transition-colors mb-16"
      >
        Connect Wallet
      </button>

      <div className="grid md:grid-cols-3 gap-8 mt-16">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Secure Escrow
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Your funds are protected by smart contracts on the Hedera network
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Neutral Arbiter
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Disputes are resolved fairly by trusted third-party arbiters
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Trustless
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            No need to trust the other party - the blockchain ensures security
          </p>
        </div>
      </div>
    </div>
  )
}

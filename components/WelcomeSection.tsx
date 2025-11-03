'use client'

<<<<<<< HEAD
import { Shield, Users, Lock, Zap, CheckCircle, Wallet } from 'lucide-react'
import { useWallet } from './WalletContext'
=======
import { Shield, Users, Lock } from 'lucide-react'
import { useWallet } from './WalletProvider'
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec

export function WelcomeSection() {
  const { connect } = useWallet()

  return (
<<<<<<< HEAD
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-full border border-blue-200 dark:border-blue-800 mb-6">
          <Zap className="text-blue-600 dark:text-blue-400" size={16} />
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            Powered by Hedera
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Secure Escrow
          <br />
          <span className="text-blue-600">Made Simple</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Create trustless peer-to-peer transactions with blockchain-powered escrow. 
          Fast, secure, and transparent.
        </p>

        <button
          onClick={connect}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/25"
        >
          <Wallet size={20} />
          Connect Wallet
        </button>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
          <CheckCircle size={16} className="text-emerald-500" />
          No signup required • Connect in seconds
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* Feature 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mb-4">
            <Shield className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Secure Escrow
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your funds are protected by Hedera Consensus Service. Immutable and transparent.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center mb-4">
            <Users className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Neutral Arbiter
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Disputes are resolved fairly by trusted third-party arbiters.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-950 rounded-lg flex items-center justify-center mb-4">
            <Lock className="text-slate-600 dark:text-slate-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Trustless
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No need to trust the other party. The blockchain ensures security.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Transaction Speed', value: '3-5s' },
          { label: 'Success Rate', value: '99.9%' },
          { label: 'Cost per Deal', value: '<$0.001' },
          { label: 'Network Uptime', value: '24/7' },
        ].map((stat, index) => (
          <div
            key={index}
            className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
=======
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
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec

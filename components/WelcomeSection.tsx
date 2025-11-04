'use client'

import { Shield, Users, Lock, Zap, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import WalletButton to prevent SSR issues
// Example from tutorial: next/dynamic with ssr: false in client component
const DynamicWalletButton = dynamic(() => import('./WalletButton').then(mod => ({ default: mod.WalletButton })), {
  ssr: false,
  loading: () => (
    <div className="inline-flex items-center gap-2 px-8 py-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-48 h-12"></div>
  ),
});

export function WelcomeSection() {

  return (
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

        <div className="flex justify-center items-center mb-4">
          <DynamicWalletButton />
        </div>

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

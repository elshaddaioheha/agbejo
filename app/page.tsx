'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { WelcomeSection } from '@/components/WelcomeSection'
import { DealsList } from '@/components/DealsList'
import { CreateDealModal } from '@/components/CreateDealModal'
import { useWallet } from '@/components/WalletProvider'

export default function Home() {
  const [showCreateDeal, setShowCreateDeal] = useState(false)
  const { connected } = useWallet()

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!connected ? (
          <WelcomeSection />
        ) : (
          <>
            <div className="mb-8 flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Your Deals
              </h1>
              <button
                onClick={() => setShowCreateDeal(true)}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                New Deal
              </button>
            </div>
            
            <DealsList />
          </>
        )}
      </div>

      {showCreateDeal && (
        <CreateDealModal onClose={() => setShowCreateDeal(false)} />
      )}
    </main>
  )
}

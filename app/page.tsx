<<<<<<< HEAD
'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { WelcomeSection } from '@/components/WelcomeSection'
import { DealsList } from '@/components/DealsList'
import { CreateDealModal } from '@/components/CreateDealModal'
import { useWallet } from '@/components/WalletProvider'
import { Plus } from 'lucide-react'

export default function Home() {
  const [showCreateDeal, setShowCreateDeal] = useState(false)
  const { connected } = useWallet()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!connected ? (
          <WelcomeSection />
        ) : (
          <>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Your Deals
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your escrow transactions
                </p>
              </div>
              
              <button
                onClick={() => setShowCreateDeal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/25"
              >
                <Plus size={20} />
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
=======
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
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec

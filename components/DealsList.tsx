// elshaddaioheha/agbejo/agbejo-99f29a1a8db16f21f85c24488ee62b2906ae9d61/components/DealsList.tsx

'use client'

import { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface Deal {
  id: string
  title: string
  amount: string
  status: 'pending' | 'active' | 'completed' | 'disputed'
  counterparty: string
  createdAt: string
}

export function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/deals')
        if (!response.ok) {
          throw new Error('Failed to fetch deals.')
        }
        const data = await response.json()
        setDeals(data)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeals()
  }, [])

  const getStatusIcon = (status: Deal['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />
      case 'active':
        return <FileText className="text-blue-500" size={20} />
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />
      case 'disputed':
        return <AlertCircle className="text-red-500" size={20} />
    }
  }

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'disputed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

  if (isLoading) {
    return <div className="text-center py-16">Loading deals...</div>
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No deals yet
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Create your first deal to get started
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {deals.map((deal) => (
        <div
          key={deal.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(deal.status)}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {deal.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Counterparty: {deal.counterparty}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created: {new Date(deal.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {deal.amount} HBAR
              </p>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  deal.status
                )}`}
              >
                {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useWallet } from './WalletProvider'

interface CreateDealModalProps {
  onClose: () => void
}

export function CreateDealModal({ onClose }: CreateDealModalProps) {
  const { accountId } = useWallet()
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    counterparty: '',
    arbiter: '',
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required.'
    if (Number(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0.'
    
    // Simple regex for Hedera Account ID format (0.0.xxxxx)
    const accountIdRegex = /^0\.0\.\d+$/
    if (!accountIdRegex.test(formData.counterparty)) {
      newErrors.counterparty = 'Invalid Account ID format (e.g., 0.0.123456).'
    }
    if (formData.arbiter && !accountIdRegex.test(formData.arbiter)) {
      newErrors.arbiter = 'Invalid Arbiter Account ID format.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const isConfirmed = window.confirm(
      'Are you sure you want to create this deal? This action cannot be undone.'
    )
    if (!isConfirmed) return

    if (!accountId) {
      setApiError('Please connect your wallet first.')
      return
    }
    setIsSubmitting(true)
    setApiError(null)

    try {
      const response = await fetch('/api/deals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer: accountId,
          seller: formData.counterparty,
          arbiter: formData.arbiter || accountId,
          amount: formData.amount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create deal.')
      }

      console.log('Deal created successfully!')
      onClose()
    } catch (error: any) {
      console.error('Error creating deal:', error)
      setApiError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full">
        {/* The modal header remains the same */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Deal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deal Title
            </label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
              placeholder="e.g., Website Development Project"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (HBAR)
            </label>
            <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required min="0.00000001" step="any"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
              placeholder="1000"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label htmlFor="counterparty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Counterparty Account ID
            </label>
            <input type="text" id="counterparty" name="counterparty" value={formData.counterparty} onChange={handleChange} required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.counterparty ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
              placeholder="0.0.123456"
            />
            {errors.counterparty && <p className="text-red-500 text-xs mt-1">{errors.counterparty}</p>}
          </div>

          <div>
            <label htmlFor="arbiter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Arbiter Account ID (Optional)
            </label>
            <input type="text" id="arbiter" name="arbiter" value={formData.arbiter} onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.arbiter ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
              placeholder="0.0.789012"
            />
            {errors.arbiter && <p className="text-red-500 text-xs mt-1">{errors.arbiter}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Describe the terms of the deal..."
            />
          </div>

          {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:bg-primary-300 dark:disabled:bg-primary-800">
              {isSubmitting ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

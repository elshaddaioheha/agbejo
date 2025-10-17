'use client';

import { useState } from 'react';

// Define the properties that this component will accept.
interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dealData: { seller: string; arbiter: string; amount: number }) => void;
  isSubmitting: boolean;
}

export default function CreateDealModal({ isOpen, onClose, onSubmit, isSubmitting }: CreateDealModalProps) {
  const [seller, setSeller] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ seller, arbiter, amount: Number(amount) });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white">Create a New Escrow Deal</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="seller" className="block text-sm font-medium text-gray-400">Seller's Account ID</label>
              <input
                type="text"
                id="seller"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="0.0.xxxxxx"
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="arbiter" className="block text-sm font-medium text-gray-400">Arbiter's Account ID</label>
              <input
                type="text"
                id="arbiter"
                value={arbiter}
                onChange={(e) => setArbiter(e.target.value)}
                placeholder="0.0.yyyyyy"
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-400">Amount (in ℏ)</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 100"
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

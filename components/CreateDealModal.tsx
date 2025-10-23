'use client';

import { useState } from 'react';
import { useWallet } from './WalletContext';
import { 
  TransferTransaction, 
  Hbar, 
  AccountId,
} from '@hashgraph/sdk';

interface CreateDealModalProps {
  onClose: () => void;
}

export const CreateDealModal = ({ onClose }: CreateDealModalProps) => {
  const { accountId, signAndExecuteTransaction, connected } = useWallet();
  const [seller, setSeller] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'transferring' | 'recording' | 'done'>('form');

  const validateAccountId = (id: string): boolean => {
    // Hedera account ID format: 0.0.xxxxx
    const pattern = /^0\.0\.\d+$/;
    return pattern.test(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!connected || !accountId) {
      setError('Please connect your wallet first');
      return;
    }

    if (!validateAccountId(seller)) {
      setError('Invalid seller account ID. Format: 0.0.xxxxx');
      return;
    }

    if (!validateAccountId(arbiter)) {
      setError('Invalid arbiter account ID. Format: 0.0.xxxxx');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    setIsLoading(true);
    setStep('transferring');

    try {
      const treasuryAccountId = process.env.NEXT_PUBLIC_TREASURY_ACCOUNT_ID;
      if (!treasuryAccountId) {
        throw new Error('Treasury account not configured');
      }

      // Step 1: Transfer HBAR to treasury (escrow)
      const transferTx = new TransferTransaction()
        .addHbarTransfer(accountId, new Hbar(-amountNum))
        .addHbarTransfer(treasuryAccountId, new Hbar(amountNum));

      const transferResponse = await signAndExecuteTransaction(transferTx);
      const transferReceipt = await transferResponse.getReceipt();

      console.log('Funds transferred to escrow:', transferReceipt.status.toString());

      // Step 2: Create deal record via API
      setStep('recording');

      const dealData = {
        buyer: accountId,
        seller,
        arbiter,
        amount: amountNum,
        description,
      };

      const response = await fetch('/api/deals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deal');
      }

      const result = await response.json();
      console.log('Deal created:', result);

      setStep('done');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset form
      setSeller('');
      setArbiter('');
      setAmount('');
      setDescription('');
      
      alert('✅ Deal created successfully! It will appear in the list shortly.');
      onClose();
    } catch (err) {
      console.error('Error creating deal:', err);
      setError(err instanceof Error ? err.message : 'Failed to create deal');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Create New Deal
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                {step === 'transferring' && (
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Transferring HBAR to escrow...
                  </p>
                )}
                {step === 'recording' && (
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Recording deal on blockchain...
                  </p>
                )}
                {step === 'done' && (
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ Deal created!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="seller" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seller Account ID *
            </label>
            <input
              type="text"
              id="seller"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              placeholder="0.0.12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="arbiter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Arbiter Account ID *
            </label>
            <input
              type="text"
              id="arbiter"
              value={arbiter}
              onChange={(e) => setArbiter(e.target.value)}
              placeholder="0.0.67890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (HBAR) *
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0.01"
              placeholder="10.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the deal terms..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            * Your account: <span className="font-mono text-primary-600">{accountId || 'Not connected'}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateDealModal;
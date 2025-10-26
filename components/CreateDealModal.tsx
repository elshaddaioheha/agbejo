'use client';

import { useState } from 'react';
import { useWallet } from './WalletContext';
import { 
  TransferTransaction, 
  Hbar,
} from '@hashgraph/sdk';
import { X, User, Award, Wallet, FileText, AlertCircle } from 'lucide-react';

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

      const transferTx = new TransferTransaction()
        .addHbarTransfer(accountId, new Hbar(-amountNum))
        .addHbarTransfer(treasuryAccountId, new Hbar(amountNum));

      const transferResponse = await signAndExecuteTransaction(transferTx);
      const transferReceipt = await transferResponse.getReceipt();

      console.log('Funds transferred to escrow:', transferReceipt.status.toString());

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Deal
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Set up a secure escrow transaction
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-800 flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin flex-shrink-0"></div>
                <div>
                  {step === 'transferring' && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Transferring HBAR...</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Sending funds to escrow</p>
                    </>
                  )}
                  {step === 'recording' && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Recording on blockchain...</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Creating immutable record</p>
                    </>
                  )}
                  {step === 'done' && (
                    <>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">✅ Deal created!</p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">Transaction confirmed</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Seller Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                Seller Account ID
              </label>
              <input
                type="text"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="0.0.12345"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                required
                disabled={isLoading}
              />
            </div>

            {/* Arbiter Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
                  <Award size={16} className="text-white" />
                </div>
                Arbiter Account ID
              </label>
              <input
                type="text"
                value={arbiter}
                onChange={(e) => setArbiter(e.target.value)}
                placeholder="0.0.67890"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                required
                disabled={isLoading}
              />
            </div>

            {/* Amount Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Wallet size={16} className="text-white" />
                </div>
                Amount (HBAR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  placeholder="10.00"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  ℏ
                </div>
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                  <FileText size={16} className="text-white" />
                </div>
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the deal terms..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Your Account Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Account (Buyer)</p>
              <p className="font-mono text-sm text-blue-900 dark:text-blue-100 font-semibold">
                {accountId || 'Not connected'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDealModal;
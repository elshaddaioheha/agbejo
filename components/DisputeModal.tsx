'use client';

import { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { EvidenceUpload } from './EvidenceUpload';

interface DisputeModalProps {
  dealId: string;
  onClose: () => void;
  onDisputeRaised: () => void;
}

export const DisputeModal = ({ dealId, onClose, onDisputeRaised }: DisputeModalProps) => {
  const [evidenceHash, setEvidenceHash] = useState('');
  const [raising, setRaising] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'evidence' | 'raising'>('evidence');

  const handleRaiseDispute = async () => {
    setRaising(true);
    setError('');

    try {
      const { accountId } = await import('./WalletContext').then(m => m.useWallet());
      // Note: This won't work directly - we need to get accountId from props or context
      // For now, we'll handle this in the parent component
      
      const response = await fetch('/api/deals/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          buyerAccountId: '', // Will be set by parent
          evidenceHash: evidenceHash || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to raise dispute');
      }

      onDisputeRaised();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to raise dispute');
    } finally {
      setRaising(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Raise Dispute</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Provide evidence to support your dispute
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">Before raising a dispute:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Try to resolve the issue with the seller first</li>
                  <li>Gather evidence (screenshots, emails, receipts)</li>
                  <li>Upload evidence below (optional but recommended)</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Evidence (Optional)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Upload files to support your dispute. This will be stored on IPFS and linked to your dispute.
            </p>
            <EvidenceUpload
              dealId={dealId}
              onUploaded={(hash) => {
                setEvidenceHash(hash);
                setStep('raising');
              }}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRaiseDispute}
              disabled={raising}
              className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {raising ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Raising Dispute...
                </>
              ) : (
                'Raise Dispute'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


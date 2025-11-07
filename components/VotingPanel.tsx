'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { CheckCircle, XCircle, Users, Loader2 } from 'lucide-react';

interface VotingPanelProps {
  dealId: string;
  arbiters: string[];
  requiredVotes: number;
  onVoteSubmitted?: () => void;
}

export const VotingPanel = ({ dealId, arbiters, requiredVotes, onVoteSubmitted }: VotingPanelProps) => {
  const { accountId } = useWallet();
  const [votingStatus, setVotingStatus] = useState<{
    currentVotes: number;
    requiredVotes: number;
    sellerVoteCount: number;
    buyerVoteCount: number;
  } | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isArbiter = accountId && arbiters.includes(accountId);

  useEffect(() => {
    if (!dealId) return;

    const fetchVotingStatus = async () => {
      try {
        const response = await fetch(`/api/deals/voting-status?dealId=${dealId}`);
        if (response.ok) {
          const data = await response.json();
          setVotingStatus(data);
        }
      } catch (error) {
        console.error('Error fetching voting status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVotingStatus();
    
    // Check if current user has voted
    if (accountId && isArbiter) {
      // This would need an API endpoint to check - for now, we'll infer from voting status
      // In a real implementation, you'd call hasArbiterVoted API
    }
  }, [dealId, accountId, isArbiter]);

  const handleVote = async (releaseToSeller: boolean) => {
    if (!accountId || !isArbiter) {
      setError('Only authorized arbiters can vote');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/deals/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          arbiterAccountId: accountId,
          releaseToSeller,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      setHasVoted(true);
      if (onVoteSubmitted) {
        onVoteSubmitted();
      }
      
      // Refresh voting status
      const statusResponse = await fetch(`/api/deals/voting-status?dealId=${dealId}`);
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setVotingStatus(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          Loading voting status...
        </div>
      </div>
    );
  }

  if (!isArbiter) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Only authorized arbiters can vote on this dispute.
        </p>
      </div>
    );
  }

  const status = votingStatus || {
    currentVotes: 0,
    requiredVotes,
    sellerVoteCount: 0,
    buyerVoteCount: 0,
  };

  const progress = (status.currentVotes / status.requiredVotes) * 100;
  const isComplete = status.currentVotes >= status.requiredVotes;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Multi-Sig Voting</h3>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Vote Progress</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {status.currentVotes} / {status.requiredVotes}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isComplete ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded border border-emerald-200 dark:border-emerald-800">
          <div className="font-semibold text-emerald-900 dark:text-emerald-100">
            Seller: {status.sellerVoteCount}
          </div>
        </div>
        <div className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
          <div className="font-semibold text-red-900 dark:text-red-100">
            Buyer: {status.buyerVoteCount}
          </div>
        </div>
      </div>

      {!hasVoted && !isComplete && (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote(true)}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Vote for Seller
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <XCircle size={16} />
            )}
            Vote for Buyer
          </button>
        </div>
      )}

      {hasVoted && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
          ✓ Your vote has been submitted
        </div>
      )}

      {isComplete && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded text-sm text-emerald-700 dark:text-emerald-300">
          ✓ Dispute resolved! {status.sellerVoteCount > status.buyerVoteCount ? 'Seller' : 'Buyer'} wins.
        </div>
      )}
    </div>
  );
};


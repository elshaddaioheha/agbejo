'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@/components/WalletContext';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, User, ArrowUpRight, Award, Wallet, Users } from 'lucide-react';
import { ReputationBadge } from '@/components/ReputationBadge';
import { VotingPanel } from '@/components/VotingPanel';
import { EvidenceUpload } from '@/components/EvidenceUpload';
import { getOnRampUrl } from '@/lib/fiat-onramp';

interface Deal {
  dealId: string;
  buyer: string;
  seller: string;
  arbiter: string;
  arbiters?: string[];
  requiredVotes?: number;
  amount: number;
  status: string;
  createdAt: string;
  sellerAccepted?: boolean;
  arbiterAccepted?: boolean;
  description?: string;
  arbiterFeeType?: 'percentage' | 'flat' | null;
  arbiterFeeAmount?: number;
  assetType?: 'HBAR' | 'FUNGIBLE_TOKEN' | 'NFT';
  assetId?: string;
  assetSerialNumber?: number;
  evidenceHash?: string;
}

export default function DealPage() {
  const params = useParams();
  const dealId = params.dealId as string;
  const { accountId, connect, connected } = useWallet();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnRamp, setShowOnRamp] = useState(false);

  useEffect(() => {
    if (dealId) {
      fetchDeal();
    }
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}`);
      if (!response.ok) {
        throw new Error('Deal not found');
      }
      const data = await response.json();
      setDeal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyWithCard = async () => {
    if (!deal || !accountId) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch('/api/onramp/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: deal.amount,
          currency: deal.assetType === 'HBAR' ? 'HBAR' : deal.assetId || 'HBAR',
          walletAddress: accountId,
          dealId: deal.dealId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate payment link');
      }

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to open payment page');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto text-gray-400" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Deal Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error || 'The deal you\'re looking for doesn\'t exist.'}</p>
        </div>
      </div>
    );
  }

  const statusConfig: Record<string, any> = {
    PROPOSED: { label: 'Proposed', icon: Clock, color: 'amber' },
    PENDING_FUNDS: { label: 'Pending Funds', icon: Clock, color: 'purple' },
    PENDING: { label: 'Pending', icon: Clock, color: 'blue' },
    DISPUTED: { label: 'Disputed', icon: AlertTriangle, color: 'rose' },
    SELLER_PAID: { label: 'Completed', icon: CheckCircle, color: 'emerald' },
    BUYER_REFUNDED: { label: 'Refunded', icon: XCircle, color: 'sky' },
  };

  const status = statusConfig[deal.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deal Details</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deal ID: {deal.dealId}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
              status.color === 'amber' ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' :
              status.color === 'purple' ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' :
              status.color === 'blue' ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' :
              status.color === 'rose' ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' :
              status.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' :
              'bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
            }`}>
              <StatusIcon size={16} />
              <span className="font-semibold">{status.label}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">
              {deal.amount} {deal.assetType === 'HBAR' ? 'ℏ' : deal.assetType === 'NFT' ? 'NFT' : 'Tokens'}
            </div>
            {deal.description && (
              <p className="text-gray-700 dark:text-gray-300 mt-2">{deal.description}</p>
            )}
          </div>

          {/* Participants */}
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Buyer</span>
              </div>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{deal.buyer}</p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-100 dark:border-emerald-900">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Seller</span>
                <ReputationBadge accountId={deal.seller} type="seller" />
              </div>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{deal.seller}</p>
            </div>

            {deal.arbiters && deal.arbiters.length > 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Arbiters ({deal.arbiters.length}, {deal.requiredVotes || 0} votes required)
                  </span>
                </div>
                <div className="space-y-2">
                  {deal.arbiters.map((arb, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Award size={14} className="text-slate-500" />
                      <p className="text-sm font-mono text-gray-900 dark:text-white">{arb}</p>
                      <ReputationBadge accountId={arb} type="arbiter" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={16} className="text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Arbiter</span>
                  <ReputationBadge accountId={deal.arbiter} type="arbiter" />
                </div>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{deal.arbiter}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!connected && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Connect your wallet to interact with this deal
              </p>
              <button
                onClick={connect}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* Fiat On-Ramp */}
          {deal.status === 'PENDING_FUNDS' && deal.buyer === accountId && (
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                Need to buy HBAR? Use your credit card:
              </p>
              <button
                onClick={handleBuyWithCard}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Wallet size={16} />
                Buy with Card
              </button>
            </div>
          )}

          {/* Dispute Section */}
          {deal.status === 'DISPUTED' && (
            <div className="space-y-4">
              {deal.evidenceHash && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mb-2">
                    <Shield size={16} />
                    <span className="font-medium">Evidence</span>
                  </div>
                  <a
                    href={`https://ipfs.io/ipfs/${deal.evidenceHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {deal.evidenceHash}
                  </a>
                </div>
              )}

              {deal.arbiters && deal.arbiters.length > 0 && deal.requiredVotes ? (
                <VotingPanel
                  dealId={deal.dealId}
                  arbiters={deal.arbiters}
                  requiredVotes={deal.requiredVotes}
                  onVoteSubmitted={fetchDeal}
                />
              ) : null}

              {(deal.buyer === accountId || deal.seller === accountId) && (
                <EvidenceUpload dealId={deal.dealId} onUploaded={fetchDeal} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


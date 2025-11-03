'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, User, ArrowUpRight, Award } from 'lucide-react';

interface Deal {
  dealId: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: number;
  status: string;
  createdAt: string;
}

export const DealsList: React.FC = () => {
  const { accountId } = useWallet();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller' | 'arbiter'>('all');
  const [lastFetch, setLastFetch] = useState<Date>(new Date());
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        setError('Failed to fetch deals from API');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Deals fetched:', data);
      setDeals(data);
      setError('');
      setLastFetch(new Date());
      setPendingStatusUpdates({});
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDealStatusOptimistically = (dealId: string, newStatus: string) => {
    setPendingStatusUpdates(prev => ({
      ...prev,
      [dealId]: newStatus
    }));

    setDeals(prevDeals =>
      prevDeals.map(deal =>
        deal.dealId === dealId
          ? { ...deal, status: newStatus }
          : deal
      )
    );
  };

  const handleReleaseFunds = async (deal: Deal) => {
    if (!confirm('Release funds to seller? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
    updateDealStatusOptimistically(deal.dealId, 'SELLER_PAID');

    try {
      const response = await fetch('/api/deals/release-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.dealId,
          seller: deal.seller,
          amount: deal.amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to release funds');
      }

      let confirmed = false;
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await fetchDeals();
        
        const updatedDeal = deals.find(d => d.dealId === deal.dealId);
        if (updatedDeal?.status === 'SELLER_PAID') {
          confirmed = true;
          break;
        }
      }
      
      if (confirmed) {
        alert('✅ Funds released successfully!');
      } else {
        alert('✅ Funds released! Confirmation pending...');
      }
    } catch (err) {
      console.error('Release funds error:', err);
      setDeals(prevDeals =>
        prevDeals.map(d =>
          d.dealId === deal.dealId ? { ...d, status: deal.status } : d
        )
      );
      setPendingStatusUpdates(prev => {
        const updated = { ...prev };
        delete updated[deal.dealId];
        return updated;
      });
      alert('❌ ' + (err instanceof Error ? err.message : 'Failed to release funds'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDispute = async (dealId: string) => {
    if (!confirm('Raise a dispute for this deal?')) {
      return;
    }

    setIsProcessing(true);
    updateDealStatusOptimistically(dealId, 'DISPUTED');

    try {
      const response = await fetch('/api/deals/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to raise dispute');
      }

      let confirmed = false;
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await fetchDeals();
        
        const updatedDeal = deals.find(d => d.dealId === dealId);
        if (updatedDeal?.status === 'DISPUTED') {
          confirmed = true;
          break;
        }
      }
      
      if (confirmed) {
        alert('✅ Dispute raised successfully!');
      } else {
        alert('✅ Dispute raised! Confirmation pending...');
      }
    } catch (err) {
      console.error('Dispute error:', err);
      const originalDeal = deals.find(d => d.dealId === dealId);
      if (originalDeal) {
        setDeals(prevDeals =>
          prevDeals.map(d =>
            d.dealId === dealId ? { ...d, status: originalDeal.status } : d
          )
        );
      }
      setPendingStatusUpdates(prev => {
        const updated = { ...prev };
        delete updated[dealId];
        return updated;
      });
      alert('❌ ' + (err instanceof Error ? err.message : 'Failed to raise dispute'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefund = async (deal: Deal) => {
    if (!confirm('Refund the buyer? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
    updateDealStatusOptimistically(deal.dealId, 'BUYER_REFUNDED');

    try {
      const response = await fetch('/api/deals/refund-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.dealId,
          buyer: deal.buyer,
          amount: deal.amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refund buyer');
      }

      let confirmed = false;
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await fetchDeals();
        
        const updatedDeal = deals.find(d => d.dealId === deal.dealId);
        if (updatedDeal?.status === 'BUYER_REFUNDED') {
          confirmed = true;
          break;
        }
      }
      
      if (confirmed) {
        alert('✅ Buyer refunded successfully!');
      } else {
        alert('✅ Refund initiated! Confirmation pending...');
      }
    } catch (err) {
      console.error('Refund error:', err);
      setDeals(prevDeals =>
        prevDeals.map(d =>
          d.dealId === deal.dealId ? { ...d, status: deal.status } : d
        )
      );
      setPendingStatusUpdates(prev => {
        const updated = { ...prev };
        delete updated[deal.dealId];
        return updated;
      });
      alert('❌ ' + (err instanceof Error ? err.message : 'Failed to refund buyer'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        label: 'Pending',
        icon: Clock,
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        dotColor: 'bg-blue-500'
      },
      SELLER_PAID: {
        label: 'Completed',
        icon: CheckCircle,
        bgColor: 'bg-emerald-50 dark:bg-emerald-950',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        dotColor: 'bg-emerald-500'
      },
      BUYER_REFUNDED: {
        label: 'Refunded',
        icon: XCircle,
        bgColor: 'bg-sky-50 dark:bg-sky-950',
        textColor: 'text-sky-700 dark:text-sky-300',
        borderColor: 'border-sky-200 dark:border-sky-800',
        dotColor: 'bg-sky-500'
      },
      DISPUTED: {
        label: 'Disputed',
        icon: AlertTriangle,
        bgColor: 'bg-rose-50 dark:bg-rose-950',
        textColor: 'text-rose-700 dark:text-rose-300',
        borderColor: 'border-rose-200 dark:border-rose-800',
        dotColor: 'bg-rose-500'
      },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const filteredDeals = deals.filter((deal: Deal) => {
    if (filter === 'all') return true;
    if (filter === 'buyer') return deal.buyer === accountId;
    if (filter === 'seller') return deal.seller === accountId;
    if (filter === 'arbiter') return deal.arbiter === accountId;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading deals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm shadow-xl">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-center text-gray-900 dark:text-white font-semibold mb-2">
              Processing transaction
            </p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Confirming on Hedera blockchain...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {lastFetch.toLocaleTimeString()}
          </div>
        </div>
        <button
          onClick={fetchDeals}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isProcessing ? 'animate-spin' : ''} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 rounded-lg">
          <p className="text-sm text-rose-700 dark:text-rose-300">⚠️ {error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All', count: deals.length },
          { key: 'buyer', label: 'Buyer', count: deals.filter((d: Deal) => d.buyer === accountId).length },
          { key: 'seller', label: 'Seller', count: deals.filter((d: Deal) => d.seller === accountId).length },
          { key: 'arbiter', label: 'Arbiter', count: deals.filter((d: Deal) => d.arbiter === accountId).length },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filter === item.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <span>{item.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
              filter === item.key
                ? 'bg-blue-500'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Deals Grid */}
      {filteredDeals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Shield className="text-gray-400" size={32} />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No deals found</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filter === 'all' 
              ? 'Create your first deal to get started'
              : `You have no deals as ${filter}`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDeals.map((deal: Deal) => {
            const statusConfig = getStatusConfig(deal.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={deal.dealId}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Deal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} ${pendingStatusUpdates[deal.dealId] ? 'animate-pulse' : ''}`}></div>
                    <StatusIcon size={14} />
                    <span className="text-sm font-semibold">{statusConfig.label}</span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {deal.amount} ℏ
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-3 mb-6">
                  {/* Buyer */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Buyer</p>
                      <p className="text-xs font-mono text-gray-900 dark:text-white truncate">{deal.buyer}</p>
                    </div>
                    {deal.buyer === accountId && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                        You
                      </span>
                    )}
                  </div>

                  {/* Seller */}
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                      <ArrowUpRight size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Seller</p>
                      <p className="text-xs font-mono text-gray-900 dark:text-white truncate">{deal.seller}</p>
                    </div>
                    {deal.seller === accountId && (
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-xs font-semibold">
                        You
                      </span>
                    )}
                  </div>

                  {/* Arbiter */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                      <Award size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Arbiter</p>
                      <p className="text-xs font-mono text-gray-900 dark:text-white truncate">{deal.arbiter}</p>
                    </div>
                    {deal.arbiter === accountId && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold">
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {deal.status === 'PENDING' && deal.buyer === accountId && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReleaseFunds(deal)}
                      disabled={isProcessing}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Release Funds
                    </button>
                    <button
                      onClick={() => handleDispute(deal.dealId)}
                      disabled={isProcessing}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Dispute
                    </button>
                  </div>
                )}

                {deal.status === 'DISPUTED' && deal.arbiter === accountId && (
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-800">
                      <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">
                        ⚖️ Resolve this dispute as arbiter
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReleaseFunds(deal)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Pay Seller
                      </button>
                      <button
                        onClick={() => handleRefund(deal)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Refund Buyer
                      </button>
                    </div>
                  </div>
                )}

                {deal.status === 'SELLER_PAID' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium text-center">
                      ✅ Deal completed successfully
                    </p>
                  </div>
                )}

                {deal.status === 'BUYER_REFUNDED' && (
                  <div className="p-3 bg-sky-50 dark:bg-sky-950 rounded-lg border border-sky-200 dark:border-sky-800">
                    <p className="text-sm text-sky-700 dark:text-sky-300 font-medium text-center">
                      ✅ Buyer refunded successfully
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DealsList;

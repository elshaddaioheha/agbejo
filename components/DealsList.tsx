'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

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
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState<Record<string, string>>({}); // Optimistic updates

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
      
      // Clear pending updates once confirmed from blockchain
      setPendingStatusUpdates({});
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  // Optimistic update - immediately update UI
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
    
    // Optimistically update UI immediately
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

      console.log('✅ Funds released successfully');
      
      // Wait for blockchain confirmation with multiple retries
      let confirmed = false;
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        await fetchDeals();
        
        const updatedDeal = deals.find(d => d.dealId === deal.dealId);
        if (updatedDeal?.status === 'SELLER_PAID') {
          confirmed = true;
          break;
        }
      }
      
      if (confirmed) {
        alert('✅ Funds released successfully! Transaction confirmed on blockchain.');
      } else {
        alert('✅ Funds released! Blockchain confirmation may take a few more seconds.');
      }
    } catch (err) {
      console.error('Release funds error:', err);
      // Revert optimistic update on error
      setDeals(prevDeals =>
        prevDeals.map(d =>
          d.dealId === deal.dealId
            ? { ...d, status: deal.status }
            : d
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
    
    // Optimistically update UI immediately
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

      console.log('✅ Dispute raised successfully');
      
      // Wait for blockchain confirmation with retries
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
        alert('✅ Dispute raised successfully! Arbiter can now resolve it.');
      } else {
        alert('✅ Dispute raised! Blockchain confirmation may take a few more seconds.');
      }
    } catch (err) {
      console.error('Dispute error:', err);
      // Revert optimistic update on error
      const originalDeal = deals.find(d => d.dealId === dealId);
      if (originalDeal) {
        setDeals(prevDeals =>
          prevDeals.map(d =>
            d.dealId === dealId
              ? { ...d, status: originalDeal.status }
              : d
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
    
    // Optimistically update UI immediately
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

      console.log('✅ Refund processed successfully');
      
      // Wait for blockchain confirmation with retries
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
        alert('✅ Refund initiated! Blockchain confirmation may take a few more seconds.');
      }
    } catch (err) {
      console.error('Refund error:', err);
      // Revert optimistic update on error
      setDeals(prevDeals =>
        prevDeals.map(d =>
          d.dealId === deal.dealId
            ? { ...d, status: deal.status }
            : d
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="text-yellow-500" size={20} />;
      case 'SELLER_PAID':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'BUYER_REFUNDED':
        return <XCircle className="text-blue-500" size={20} />;
      case 'DISPUTED':
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <Shield className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'SELLER_PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'BUYER_REFUNDED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading deals from Hedera...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-center text-gray-900 dark:text-white font-medium">
              Processing transaction...
            </p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              Confirming on Hedera blockchain...
            </p>
          </div>
        </div>
      )}

      {/* Error/Warning Banner */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button 
            onClick={fetchDeals}
            className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Last Update Info */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} />
          <span>Last updated: {lastFetch.toLocaleTimeString()}</span>
        </div>
        <button
          onClick={fetchDeals}
          disabled={isProcessing}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          Refresh Now
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          All Deals ({deals.length})
        </button>
        <button
          onClick={() => setFilter('buyer')}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            filter === 'buyer'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          As Buyer ({deals.filter((d: Deal) => d.buyer === accountId).length})
        </button>
        <button
          onClick={() => setFilter('seller')}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            filter === 'seller'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          As Seller ({deals.filter((d: Deal) => d.seller === accountId).length})
        </button>
        <button
          onClick={() => setFilter('arbiter')}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            filter === 'arbiter'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          As Arbiter ({deals.filter((d: Deal) => d.arbiter === accountId).length})
        </button>
      </div>

      {filteredDeals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No deals found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {filter === 'all' 
              ? 'Create your first deal to get started'
              : `You have no deals as ${filter}`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDeals.map((deal: Deal) => (
            <div
              key={deal.dealId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(deal.status)}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      deal.status
                    )}`}
                  >
                    {deal.status}
                    {pendingStatusUpdates[deal.dealId] && (
                      <span className="ml-2 animate-pulse">⏳</span>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {deal.amount} ℏ
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(deal.createdAt).toLocaleDateString()} at {new Date(deal.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm bg-gray-50 dark:bg-gray-700 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Buyer:</span>
                  <span className="font-mono text-gray-900 dark:text-white text-xs">
                    {deal.buyer}
                    {deal.buyer === accountId && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">You</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Seller:</span>
                  <span className="font-mono text-gray-900 dark:text-white text-xs">
                    {deal.seller}
                    {deal.seller === accountId && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">You</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Arbiter:</span>
                  <span className="font-mono text-gray-900 dark:text-white text-xs">
                    {deal.arbiter}
                    {deal.arbiter === accountId && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">You</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {deal.status === 'PENDING' && deal.buyer === accountId && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleReleaseFunds(deal)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Release Funds
                  </button>
                  <button
                    onClick={() => handleDispute(deal.dealId)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    Dispute
                  </button>
                </div>
              )}

              {deal.status === 'DISPUTED' && deal.arbiter === accountId && (
                <div className="space-y-2">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                      ⚖️ This deal is in dispute. As the arbiter, you must resolve it.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleReleaseFunds(deal)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pay Seller
                    </button>
                    <button
                      onClick={() => handleRefund(deal)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Refund Buyer
                    </button>
                  </div>
                </div>
              )}

              {deal.status === 'SELLER_PAID' && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ Deal completed - Funds released to seller
                  </p>
                </div>
              )}

              {deal.status === 'BUYER_REFUNDED' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ✅ Deal cancelled - Funds refunded to buyer
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DealsList;
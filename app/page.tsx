'use client';

import { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import CreateDealModal from '@/components/CreateDealModal';
import { useWallet } from '@/context/WalletContext';
import { TransferTransaction, Hbar, AccountId, Client, TransactionId, TransactionResponse } from '@hashgraph/sdk';

// --- Type Definitions & Components ---
type Deal = { dealId: string; buyer: string; seller: string; arbiter: string; amount: number; status: string; createdAt: string; };

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

function StatusBadge({ status }: { status: string }) {
  const baseClasses = "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full";
  switch (status) {
    case 'FUNDED': 
      return <span className={`${baseClasses} bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/50`}>Funded</span>;
    case 'PENDING': 
      return <span className={`${baseClasses} bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50`}>Pending</span>;
    case 'DISPUTED': 
      return <span className={`${baseClasses} bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/50`}>Disputed</span>;
    case 'SELLER_PAID':
    case 'BUYER_REFUNDED': 
      return <span className={`${baseClasses} bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700/50`}>Completed</span>;
    default: 
      return <span className={`${baseClasses} bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700/50`}>{status}</span>;
  }
}

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDepositing, setIsDepositing] = useState<string | null>(null);
  const [isReleasing, setIsReleasing] = useState<string | null>(null);
  const [isDisputing, setIsDisputing] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<string | null>(null);

  const { accountId, connect, disconnect, executeTransaction, error, loading: walletLoading } = useWallet();

  // Initialize a public query client for Hedera testnet
  const queryClient = Client.forTestnet();

  // --- Data Fetching ---
  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[Debug] Fetching deals with accountId:', accountId);
      const response = await fetch(`/api/deals?accountId=${accountId || ''}`);
      const data = await response.json();
      console.log('[Debug] Fetch response:', response.status, data);
      
      if (Array.isArray(data)) {
        setDeals([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        console.error("API returned non-array data:", data);
        setDeals([]);
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error);
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    console.log('[Debug] accountId changed:', accountId, 'walletLoading:', walletLoading);
    if (accountId && !walletLoading) {
      fetchDeals();
    } else {
      setDeals([]);
      setIsLoading(false);
    }
  }, [accountId, walletLoading, fetchDeals]);

  // --- Event Handlers ---
  const handleCreateDeal = async (dealData: { seller: string; arbiter: string; amount: number }) => {
    if (!accountId) {
      alert("Please connect your wallet first to create a deal.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/deals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dealData, buyer: accountId }),
      });
      if (!response.ok) throw new Error('Failed to create deal');
      setIsModalOpen(false);
      await fetchDeals();
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepositFunds = async (deal: Deal) => {
    if (!accountId) {
      alert("Please connect your wallet to deposit funds.");
      return;
    }
    setIsDepositing(deal.dealId);
    try {
      const treasuryAccountId = process.env.NEXT_PUBLIC_TREASURY_ACCOUNT_ID;
      if (!treasuryAccountId) throw new Error("Treasury Account ID not configured");

      const trans = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(accountId), new Hbar(-deal.amount))
        .addHbarTransfer(AccountId.fromString(treasuryAccountId), new Hbar(deal.amount))
        .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)))
        .setMaxTransactionFee(new Hbar(1));

      console.log('[Debug] Tx before execute:', trans.toString());

      const response: TransactionResponse = await executeTransaction(trans);

      // Get receipt with query client
      const receipt = await response.getReceipt(queryClient);
      console.log('[Debug] Transaction receipt:', receipt.status.toString());

      await fetch('/api/deals/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, status: 'FUNDED', type: 'DEPOSIT_FUNDS' }),
      });

      await fetchDeals();
    } catch (error) {
      console.error("Error depositing funds:", error);
    } finally {
      setIsDepositing(null);
    }
  };

  const handleReleaseFunds = async (deal: Deal) => {
    if (!accountId || accountId !== deal.buyer) {
      alert("Only the buyer can release funds.");
      return;
    }
    setIsReleasing(deal.dealId);
    try {
      const treasuryAccountId = process.env.NEXT_PUBLIC_TREASURY_ACCOUNT_ID;
      if (!treasuryAccountId) throw new Error("Treasury Account ID not configured");

      const trans = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(treasuryAccountId), new Hbar(-deal.amount))
        .addHbarTransfer(AccountId.fromString(deal.seller), new Hbar(deal.amount))
        .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)))
        .setMaxTransactionFee(new Hbar(1));

      const response = await executeTransaction(trans);

      await fetch('/api/deals/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, status: 'SELLER_PAID', type: 'RELEASE_FUNDS' }),
      });

      await fetchDeals();
    } catch (error) {
      console.error("Error releasing funds:", error);
    } finally {
      setIsReleasing(null);
    }
  };

  const handleDispute = async (deal: Deal) => {
    if (!accountId) {
      alert("Please connect your wallet to dispute.");
      return;
    }
    setIsDisputing(deal.dealId);
    try {
      await fetch('/api/deals/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, status: 'DISPUTED', type: 'DISPUTE' }),
      });

      await fetchDeals();
    } catch (error) {
      console.error("Error disputing:", error);
    } finally {
      setIsDisputing(null);
    }
  };

  const handleResolveDispute = async (deal: Deal, resolution: 'SELLER_PAID' | 'BUYER_REFUNDED') => {
    if (!accountId || accountId !== deal.arbiter) {
      alert("Only the arbiter can resolve disputes.");
      return;
    }
    setIsResolving(deal.dealId);
    try {
      const treasuryAccountId = process.env.NEXT_PUBLIC_TREASURY_ACCOUNT_ID;
      if (!treasuryAccountId) throw new Error("Treasury Account ID not configured");

      const trans = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(treasuryAccountId), new Hbar(-deal.amount))
        .addHbarTransfer(AccountId.fromString(resolution === 'SELLER_PAID' ? deal.seller : deal.buyer), new Hbar(deal.amount))
        .setTransactionId(TransactionId.generate(AccountId.fromString(accountId)))
        .setMaxTransactionFee(new Hbar(1));

      const response = await executeTransaction(trans);

      await fetch('/api/deals/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, status: resolution, type: 'RESOLVE_DISPUTE' }),
      });

      await fetchDeals();
    } catch (error) {
      console.error("Error resolving dispute:", error);
    } finally {
      setIsResolving(null);
    }
  };

  // --- JSX ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="border-b border-slate-700/50 py-6 px-6">
          <nav className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Agbejo</h1>
            </div>
            <div>
              {accountId ? (
                <button 
                  onClick={disconnect} 
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                >
                  Disconnect
                </button>
              ) : (
                <button 
                  onClick={connect} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <WalletIcon />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Escrow Dashboard</h2>
              <p className="text-slate-300">Manage your decentralized escrow deals on Hedera</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 self-start sm:self-auto"
            >
              <PlusIcon />
              <span>New Deal</span>
            </button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-300">Loading deals from Hedera...</p>
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-16 bg-slate-800 rounded-2xl border border-slate-700 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-slate-400 dark:text-slate-500">
                  <path d="M20 7H4M20 12H4M14 17H4"/>
                </svg>
                <h3 className="text-2xl font-bold text-white mb-2">No Deals Yet</h3>
                <p className="text-slate-300 mb-6">Create your first escrow deal to get started on Hedera.</p>
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
                >
                  <PlusIcon />
                  <span>Create Deal</span>
                </button>
              </div>
            ) : (
              deals.map((deal) => (
                <div key={deal.dealId} className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <StatusBadge status={deal.status} />
                        <span className="text-sm text-slate-400 font-mono">{deal.dealId.slice(0, 8)}...</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Buyer</p>
                          <p className="font-semibold text-white">{deal.buyer.slice(0, 8)}...</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Seller</p>
                          <p className="font-semibold text-white">{deal.seller.slice(0, 8)}...</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Arbiter</p>
                          <p className="font-semibold text-white">{deal.arbiter.slice(0, 8)}...</p>
                        </div>
                        <div className="sm:col-span-3 sm:mt-4">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                          <p className="text-2xl font-bold text-white">
                            {deal.amount} <span className="text-lg text-emerald-400">ℏ</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:flex-shrink-0">
                      {deal.status === 'PENDING' && accountId === deal.buyer && (
                        <button 
                          onClick={() => handleDepositFunds(deal)} 
                          disabled={isDepositing === deal.dealId}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
                        >
                          {isDepositing === deal.dealId ? 'Processing...' : 'Deposit Funds'}
                        </button>
                      )}
                      
                      {deal.status === 'FUNDED' && (
                        <>
                          {accountId === deal.buyer && (
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleReleaseFunds(deal)} 
                                disabled={isReleasing === deal.dealId}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
                              >
                                {isReleasing === deal.dealId ? 'Releasing...' : 'Release Funds'}
                              </button>
                              <button 
                                onClick={() => handleDispute(deal)} 
                                disabled={isDisputing === deal.dealId}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
                              >
                                {isDisputing === deal.dealId ? 'Disputing...' : 'Dispute'}
                              </button>
                            </div>
                          )}
                          {accountId === deal.seller && (
                            <div className="flex gap-3">
                              <p className="font-medium text-blue-400 text-sm">Awaiting Buyer Release</p>
                              <button 
                                onClick={() => handleDispute(deal)} 
                                disabled={isDisputing === deal.dealId}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
                              >
                                {isDisputing === deal.dealId ? 'Disputing...' : 'Dispute'}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      
                      {deal.status === 'DISPUTED' && (
                        <>
                          {accountId === deal.arbiter ? (
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleResolveDispute(deal, 'SELLER_PAID')} 
                                disabled={isResolving === deal.dealId}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
                              >
                                {isResolving === deal.dealId ? 'Resolving...' : 'Pay Seller'}
                              </button>
                              <button 
                                onClick={() => handleResolveDispute(deal, 'BUYER_REFUNDED')} 
                                disabled={isResolving === deal.dealId}
                                className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
                              >
                                {isResolving === deal.dealId ? 'Resolving...' : 'Refund Buyer'}
                              </button>
                            </div>
                          ) : (
                            <p className="font-medium text-amber-400 text-sm">Awaiting Arbiter Resolution</p>
                          )}
                        </>
                      )}
                      
                      {(deal.status === 'SELLER_PAID' || deal.status === 'BUYER_REFUNDED') && (
                        <p className="font-medium text-emerald-400 text-sm">Deal Complete</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
      <CreateDealModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateDeal} isSubmitting={isSubmitting} />
    </div>
  );
}
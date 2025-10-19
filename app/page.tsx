'use client';

import { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import CreateDealModal from '@/components/CreateDealModal';
import { useWallet } from '@/context/WalletContext';
import { TransferTransaction, Hbar, AccountId, Client, TransactionResponse } from '@hashgraph/sdk';
import { DealCardSkeleton } from '@/components/DealCardSkeleton';
import StatusSplash from '@/components/StatusSplash';
import WalletConnect from '@/components/WalletConnect';

// --- Type Definitions & Components ---
type Deal = { dealId: string; buyer: string; seller: string; arbiter: string; amount: number; status: string; createdAt: string; };
type Status = { open: boolean; kind: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string };


function RoleBadge({ deal, currentAccountId }: { deal: Deal; currentAccountId: string | null }) {
  let role = null;
  if (!currentAccountId) return null;
  if (currentAccountId === deal.buyer) role = 'Buyer';
  else if (currentAccountId === deal.seller) role = 'Seller';
  else if (currentAccountId === deal.arbiter) role = 'Arbiter';
  if (!role) return null;

  return (
    <span className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700/50">
      Your Role: {role}
    </span>
  );
}

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
function StatusBadge({ status }: { status: string }) {
    const baseClasses = "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full";
    switch (status) {
        case 'FUNDED': return <span className={`${baseClasses} bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/50`}>Funded</span>;
        case 'PENDING': return <span className={`${baseClasses} bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50`}>Pending</span>;
        case 'DISPUTED': return <span className={`${baseClasses} bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/50`}>Disputed</span>;
        case 'SELLER_PAID':
        case 'BUYER_REFUNDED': return <span className={`${baseClasses} bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700/50`}>Completed</span>;
        default: return <span className={`${baseClasses} bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700/50`}>{status}</span>;
    }
}

// --- Main HomePage Component ---
export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ open: false, kind: 'info', title: '' });


  const { accountId, connect, disconnect, executeTransaction, isConnecting, isDisconnecting } = useWallet();
  const queryClient = Client.forTestnet();

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred.';
  };

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/deals`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const userDeals = data.filter(deal => 
            deal.buyer === accountId || 
            deal.seller === accountId || 
            deal.arbiter === accountId
        );
        setDeals(userDeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else { setDeals([]); }
    } catch (error) { setDeals([]); }
    finally { setIsLoading(false); }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
        fetchDeals();
    } else {
        setIsLoading(false);
        setDeals([]);
    }
  }, [accountId, fetchDeals]);

  const handleCreateDeal = async (dealData: { seller: string; arbiter: string; amount: number }) => {
     if (!accountId) { 
        setStatus({ open: true, kind: 'error', title: 'Wallet Not Connected', message: 'Please connect your wallet first.' });
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
        setStatus({ open: true, kind: 'success', title: 'Deal Created!', message: 'The new deal has been successfully created.' });
    } catch (error: unknown) { 
        setStatus({ open: true, kind: 'error', title: 'Creation Failed', message: getErrorMessage(error) });
    }
    finally { setIsSubmitting(false); }
  };

  const handleDepositFunds = async (deal: Deal) => {
    if (!accountId) { 
        setStatus({ open: true, kind: 'error', title: 'Wallet Not Connected', message: 'Please connect your wallet to deposit.' });
        return; 
    }
    setIsSubmitting(true);
    try {
      const treasuryAccountId = process.env.NEXT_PUBLIC_TREASURY_ACCOUNT_ID;
      if (!treasuryAccountId) throw new Error("Treasury Account ID not configured");
      const trans = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(accountId), new Hbar(-deal.amount))
        .addHbarTransfer(AccountId.fromString(treasuryAccountId), new Hbar(deal.amount))
        .setMaxTransactionFee(new Hbar(1));
      const response: TransactionResponse = await executeTransaction(trans);
      await response.getReceipt(queryClient);
      
      await fetch('/api/deals/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, status: 'FUNDED', type: 'DEPOSIT_FUNDS' }),
      });
      setDeals(currentDeals => currentDeals.map(d => d.dealId === deal.dealId ? { ...d, status: 'FUNDED' } : d));
      setStatus({ open: true, kind: 'success', title: 'Deposit Successful!', message: `Successfully deposited ${deal.amount} HBAR.` });
    } catch (error: unknown) { 
        setStatus({ open: true, kind: 'error', title: 'Deposit Failed', message: getErrorMessage(error) });
        await fetchDeals(); 
    }
    finally { setIsSubmitting(false); }
  };
  
  const handleDispute = async (deal: Deal) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/deals/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId }),
      });
      setDeals(currentDeals => currentDeals.map(d => d.dealId === deal.dealId ? { ...d, status: 'DISPUTED' } : d));
      setStatus({ open: true, kind: 'warning', title: 'Deal Disputed', message: 'The deal is now in dispute. The arbiter can resolve it.' });
    } catch (error: unknown) { 
        setStatus({ open: true, kind: 'error', title: 'Dispute Failed', message: getErrorMessage(error) });
        await fetchDeals(); 
    }
    finally { setIsSubmitting(false); }
  };

  const handlePaySeller = async (deal: Deal) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/deals/pay-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, seller: deal.seller, amount: deal.amount }),
      });
      setDeals(currentDeals => currentDeals.map(d => d.dealId === deal.dealId ? { ...d, status: 'SELLER_PAID' } : d));
      setStatus({ open: true, kind: 'success', title: 'Seller Paid!', message: `The funds have been released to the seller.` });
    } catch (error: unknown) { 
        setStatus({ open: true, kind: 'error', title: 'Payment Failed', message: getErrorMessage(error) });
        await fetchDeals(); 
    }
    finally { setIsSubmitting(false); }
  };

  const handleRefundBuyer = async (deal: Deal) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/deals/refund-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, buyer: deal.buyer, amount: deal.amount }),
      });
      setDeals(currentDeals => currentDeals.map(d => d.dealId === deal.dealId ? { ...d, status: 'BUYER_REFUNDED' } : d));
      setStatus({ open: true, kind: 'success', title: 'Buyer Refunded!', message: `The funds have been returned to the buyer.` });
    } catch (error: unknown) { 
        setStatus({ open: true, kind: 'error', title: 'Refund Failed', message: getErrorMessage(error) });
        await fetchDeals();
    }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Agbejo</h1>
        <WalletConnect />
      </header>
      
      <main className="p-4 md:p-8">
        <ErrorBoundary>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Your Deals</h2>
                    <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={!accountId}
                    className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-slate-800 dark:bg-slate-50 dark:text-slate-900 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <PlusIcon />
                    New Deal
                    </button>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                    <div className="space-y-4">
                        <DealCardSkeleton />
                        <DealCardSkeleton />
                        <DealCardSkeleton />
                    </div>
                    ) : !accountId ? (
                        <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                           <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to Project Agbejo</h3>
                           <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                            A secure, decentralized escrow service. Please connect your wallet to view or create deals.
                           </p>
                           <button onClick={connect} disabled={isConnecting} className="mt-6 px-5 py-2.5 mx-auto font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                           </button>
                        </div>
                    ) : deals.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No Deals Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                        You are not yet a participant in any deals. Create one to get started!
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 flex items-center gap-2 px-5 py-2.5 mx-auto font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <PlusIcon />
                            Create Your First Deal
                        </button>
                    </div>
                    ) : (
                    deals.map((deal) => (
                        <div key={deal.dealId} className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-mono text-xs text-slate-500">Deal ID: {deal.dealId}</p>
                                    <p className="font-bold text-lg">{deal.amount} HBAR</p>
                                    <div className="flex items-center mt-2">
                                        <StatusBadge status={deal.status} />
                                        <RoleBadge deal={deal} currentAccountId={accountId} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {deal.status === 'PENDING' && deal.buyer === accountId && (
                                        <button
                                            onClick={() => handleDepositFunds(deal)}
                                            disabled={isSubmitting}
                                            className="px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400"
                                        >
                                            {isSubmitting ? 'Processing...' : 'Deposit Funds'}
                                        </button>
                                    )}
                                    {deal.status === 'FUNDED' && (deal.buyer === accountId || deal.seller === accountId) && (
                                        <button
                                        onClick={() => handleDispute(deal)}
                                        disabled={isSubmitting}
                                        className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400"
                                        >
                                        {isSubmitting ? 'Processing...' : 'Dispute Deal'}
                                        </button>
                                    )}
                                    {deal.status === 'DISPUTED' && accountId === deal.arbiter && (
                                        <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePaySeller(deal)}
                                            disabled={isSubmitting}
                                            className="px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400"
                                        >
                                            Pay Seller
                                        </button>
                                        <button
                                            onClick={() => handleRefundBuyer(deal)}
                                            disabled={isSubmitting}
                                            className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                                        >
                                            Refund Buyer
                                        </button>
                                        </div>
                                    )}
                                </div>
                        </div>
                        </div>
                    ))
                    )}
                </div>
            </div>
        </ErrorBoundary>
      </main>
      <CreateDealModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateDeal} 
        isSubmitting={isSubmitting} 
      />
      <StatusSplash
        open={status.open}
        kind={status.kind}
        title={status.title}
        message={status.message}
        onClose={() => setStatus({ ...status, open: false })}
      />
    </div>
  );

}

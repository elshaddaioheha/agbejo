'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  History,
  Settings,
  Wallet,
  LogOut,
  Plus,
  Milestone,
  Activity,
  Gauge,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  User,
  Users,
  CheckCircle,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import CreateDealModal from '@/components/CreateDealModal';
import { DealCardSkeleton } from '@/components/DealCardSkeleton';
import { useWallet } from '@/context/WalletContext';
import { TransferTransaction, Hbar, AccountId, Client, TransactionId, TransactionResponse } from '@hashgraph/sdk';

// --- Icons ---
const SidebarIcon = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
    className="w-10 h-10 flex items-center justify-center rounded-xl cursor-not-allowed transition-colors"
  >
    {children}
  </motion.div>
);

// --- Type Definitions & Components ---
type Deal = { dealId: string; buyer: string; seller: string; arbiter: string; amount: number; status: string; createdAt: string; };

function StatusBadge({ status }: { status: string }) {
  const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-soft";
  switch (status) {
    case 'FUNDED':
      return <span className={`${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}><CheckCircle size={10} /> Funded</span>;
    case 'PENDING':
      return <span className={`${baseClasses} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`}><Clock size={10} /> Pending</span>;
    case 'DISPUTED':
      return <span className={`${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}><AlertTriangle size={10} /> Disputed</span>;
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400`}>{status}</span>;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { accountId, connect, disconnect, executeTransaction, error, loading } = useWallet();
  const queryClient = Client.forTestnet();

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('agbejo-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Switching theme to:', newTheme);
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    // Support both data-theme attribute and .dark class for maximum compatibility
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('agbejo-theme', newTheme);
  };

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/deals?accountId=${accountId || ''}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setDeals([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error("Failed to fetch deals:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId && !loading) {
      fetchDeals();
    } else {
      setDeals([]);
      setIsLoading(false);
    }
  }, [accountId, loading, fetchDeals]);

  const handleCreateDeal = async (dealData: { seller: string; arbiter: string; amount: number }) => {
    if (!accountId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/deals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dealData, buyer: accountId }),
      });
      if (response.ok) {
        setIsModalOpen(false);
        await fetchDeals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepositFunds = async (deal: Deal) => {
    if (!accountId) return;
    setIsDepositing(deal.dealId);
    try {
      const treasuryAccountId = process.env.NEXT_PUBLIC_TREASURY_ACCOUNT_ID;
      if (!treasuryAccountId) throw new Error("Treasury missing");

      const trans = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(accountId), new Hbar(-deal.amount))
        .addHbarTransfer(AccountId.fromString(treasuryAccountId), new Hbar(deal.amount))
        .setMaxTransactionFee(new Hbar(1));

      await executeTransaction(trans);
      await fetch('/api/deals/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, status: 'FUNDED', type: 'DEPOSIT_FUNDS' }),
      });
      await fetchDeals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDepositing(null);
    }
  };

  const handleReleaseFunds = async (deal: Deal) => {
    if (!accountId || accountId !== deal.buyer) return;
    setIsReleasing(deal.dealId);
    try {
      await fetch('/api/deals/pay-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, seller: deal.seller, amount: deal.amount }),
      });
      await fetchDeals();
    } catch (err) {
      console.error(err);
    } finally {
      setIsReleasing(null);
    }
  };

  const handleDispute = async (deal: Deal) => {
    setIsDisputing(deal.dealId);
    try {
      await fetch('/api/deals/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.dealId, status: 'DISPUTED', type: 'DISPUTE' }),
      });
      await fetchDeals();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDisputing(null);
    }
  };

  const handleResolveDispute = async (deal: Deal, resolution: 'SELLER_PAID' | 'BUYER_REFUNDED') => {
    setIsResolving(deal.dealId);
    try {
      const endpoint = resolution === 'SELLER_PAID' ? '/api/deals/pay-seller' : '/api/deals/refund-buyer';
      const body = resolution === 'SELLER_PAID'
        ? { dealId: deal.dealId, seller: deal.seller, amount: deal.amount }
        : { dealId: deal.dealId, buyer: deal.buyer, amount: deal.amount };

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await fetchDeals();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(null);
    }
  };

  const filteredDeals = deals.filter(deal =>
    deal.dealId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.buyer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex min-h-screen bg-brand-secondary selection:bg-brand-primary/30 transition-all duration-500 ease-in-out dark:bg-dark-bg"
    >
      {/* --- Desktop Sidebar --- */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-dark-card border-r border-gray-100 dark:border-white/10 px-6 py-8 hidden lg:flex flex-col z-20"
      >
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20"
          >
            <span className="text-brand-dark font-black text-xl">A</span>
          </motion.div>
          <h1 className="text-xl font-bold tracking-tight dark:text-white text-brand-dark">Agbejo</h1>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-brand-muted dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-white/5 dark:text-white border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary/50 transition-all outline-none"
          />
        </div>

        <nav className="flex-1 space-y-1.5">
          <motion.a
            whileHover={{ x: 4 }}
            href="#"
            className="flex items-center gap-3 px-4 py-3.5 bg-brand-primary/10 text-brand-primary rounded-2xl font-bold transition-all"
          >
            <LayoutDashboard size={20} strokeWidth={2.5} />
            Dashboard
          </motion.a>
          {[
            { label: 'Portfolio', icon: Briefcase },
            { label: 'Markets', icon: TrendingUp },
            { label: 'Transactions', icon: History },
            { label: 'Settings', icon: Settings },
          ].map((item) => (
            <motion.a
              key={item.label}
              whileHover={{ x: 4 }}
              href="#"
              className="flex items-center gap-3 px-4 py-3.5 text-brand-muted dark:text-gray-400 hover:text-brand-dark dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl font-medium transition-all"
            >
              <item.icon size={20} />
              {item.label}
            </motion.a>
          ))}
        </nav>

        {/* User Profile Footer in Sidebar */}
        <div className="pt-6 border-t border-gray-100 dark:border-white/10 mt-6">
          <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary">
              <User size={20} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black dark:text-white truncate">{accountId || 'Guest'}</p>
              <p className="text-[10px] font-bold text-brand-muted uppercase">Verified Account</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* --- Mobile Header --- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-100 dark:border-white/10 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <span className="text-brand-dark font-black">A</span>
          </div>
          <span className="font-bold tracking-tight dark:text-white">Agbejo</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-brand-muted">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {accountId ? (
            <button onClick={disconnect} className="p-2 bg-red-50 text-red-600 rounded-xl">
              <LogOut size={20} />
            </button>
          ) : (
            <button onClick={connect} className="p-2 bg-brand-primary text-brand-dark rounded-xl">
              <Wallet size={20} />
            </button>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 lg:ml-[280px] px-6 lg:px-10 pt-24 lg:pt-10 pb-32 lg:pb-10 max-w-[1440px] mx-auto w-full">
        {/* Desktop Header Row */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:flex justify-between items-center mb-10"
        >
          <h2 className="text-3xl font-bold text-brand-dark dark:text-white tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark px-6 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2"
            >
              <Plus size={18} />
              Create Deal
            </motion.button>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-white/10 text-brand-muted hover:text-brand-primary transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <AnimatePresence mode="wait">
              {accountId ? (
                <div className="flex items-center gap-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-white/10 p-2 pl-4 rounded-2xl">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-brand-muted tracking-widest">Connected</p>
                    <p className="text-sm font-black text-brand-dark dark:text-white">{accountId.slice(0, 10)}...</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={disconnect}
                    className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-2.5 rounded-xl transition-colors"
                  >
                    <LogOut size={18} />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={connect}
                  className="bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark px-6 py-3 rounded-2xl font-extrabold shadow-lg flex items-center gap-3"
                >
                  <Wallet size={18} />
                  Connect Wallet
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* --- Hero Stats Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dark-card rounded-[32px] p-8 card-shadow border border-gray-50 dark:border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-widest mb-4">Account Portfolio</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-brand-dark dark:text-white leading-none tracking-tighter">
                ${(deals.reduce((acc, curr) => acc + curr.amount, 0) * 0.065).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xl font-bold text-brand-primary/40 italic">USD</span>
            </div>
            <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Sync Active</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-brand-muted uppercase">Total Balance</p>
                <p className="text-lg font-black text-brand-dark dark:text-white">{deals.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} HBAR</p>
              </div>
            </div>
          </motion.div>

          {/* Deals Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-dark-card rounded-[32px] p-8 card-shadow border border-gray-50 dark:border-white/5"
          >
            <div className="flex justify-between items-start mb-6">
              <Briefcase className="text-brand-primary" size={32} />
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12% this week</p>
              </div>
            </div>
            <h3 className="text-4xl font-black text-brand-dark dark:text-white leading-none tracking-tighter mb-2">{deals.length}</h3>
            <p className="text-xs font-bold text-brand-muted dark:text-gray-400 uppercase tracking-widest">Active Escrow Contracts</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-transparent hover:border-brand-primary/10 transition-colors">
                <p className="text-[9px] font-black text-brand-muted uppercase mb-1">Success Rate</p>
                <p className="text-md font-black text-emerald-500">98.4%</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-transparent hover:border-brand-primary/10 transition-colors">
                <p className="text-[9px] font-black text-brand-muted uppercase mb-1">Network</p>
                <p className="text-md font-black text-brand-primary">Testnet</p>
              </div>
            </div>
          </motion.div>

          {/* Wallets or Rates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-brand-dark rounded-[32px] p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-brand-primary/10 blur-3xl rounded-full" />
            <div className="relative">
              <p className="text-brand-primary/60 text-[10px] font-black uppercase tracking-widest mb-6">Market Overview</p>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-sm">HBAR / USD</span>
                  <span className="text-xl font-black text-brand-primary font-mono">$0.0652</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-sm">HBAR / NGN</span>
                  <span className="text-xl font-black text-brand-primary font-mono">₦104.22</span>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <TrendingUp className="text-emerald-400" size={20} />
                  <span className="text-white font-black">+4.2%</span>
                  <span className="text-white/40 text-xs ml-auto">Last 24h</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- Active Deals Section (Promoted) --- */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-brand-dark dark:text-white tracking-tight flex items-center gap-3">
              Active Deals
              <span className="bg-brand-primary/20 text-brand-primary text-xs px-2.5 py-1 rounded-full font-black">{deals.length}</span>
            </h3>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex bg-white dark:bg-dark-card border border-gray-100 dark:border-white/10 p-1 rounded-2xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-primary/10 text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark dark:hover:text-white'}`}
                >
                  <LayoutDashboard size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-primary/10 text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-dark dark:hover:text-white'}`}
                >
                  <Activity size={18} />
                </button>
              </div>
              <div className="h-8 w-px bg-gray-100 dark:bg-white/10" />
              <div className="hidden md:flex bg-white dark:bg-dark-card border border-gray-100 dark:border-white/10 p-1.5 rounded-2xl">
                <button className="px-4 py-2 bg-gray-50 dark:bg-white/10 text-brand-dark dark:text-white text-xs font-black rounded-xl">All</button>
                <button className="px-4 py-2 text-brand-muted text-xs font-bold hover:text-brand-primary transition-colors">Pending</button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="loading"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              >
                {[1, 2, 3].map(i => <DealCardSkeleton key={i} />)}
              </motion.div>
            ) : filteredDeals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="empty"
                className="bg-white dark:bg-dark-card rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 dark:border-white/10"
              >
                <Briefcase size={48} className="text-brand-primary/20 mx-auto mb-6" />
                <h4 className="text-xl font-black text-brand-dark dark:text-white mb-2">No active agreements</h4>
                <p className="text-brand-muted max-w-xs mx-auto text-sm">Create your first decentralized escrow contract to get started.</p>
              </motion.div>
            ) : (
              viewMode === 'list' ? (
                <div className="bg-white dark:bg-dark-card rounded-[32px] overflow-hidden border border-gray-100 dark:border-white/10 shadow-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-widest">Deal ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-widest">Counterparty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {filteredDeals.map((deal) => (
                        <tr key={deal.dealId} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold dark:text-gray-400">#{deal.dealId.slice(0, 8)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-black dark:text-white truncate max-w-[150px]">
                              {accountId === deal.buyer ? deal.seller : deal.buyer}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black dark:text-brand-primary">{deal.amount.toLocaleString()} HBAR</span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={deal.status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {deal.status === 'PENDING' && accountId === deal.buyer && (
                                <button
                                  onClick={() => handleDepositFunds(deal)}
                                  disabled={isDepositing === deal.dealId}
                                  className="bg-brand-primary text-brand-dark px-4 py-1.5 rounded-lg text-[10px] font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                  {isDepositing === deal.dealId ? 'Wait...' : 'Deposit'}
                                </button>
                              )}
                              {deal.status === 'FUNDED' && accountId === deal.buyer && (
                                <button
                                  onClick={() => handleReleaseFunds(deal)}
                                  disabled={isReleasing === deal.dealId}
                                  className="bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark px-4 py-1.5 rounded-lg text-[10px] font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                  {isReleasing === deal.dealId ? 'Wait...' : 'Release'}
                                </button>
                              )}
                              <button
                                onClick={() => handleDispute(deal)}
                                disabled={isDisputing === deal.dealId}
                                className="text-red-500 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                              >
                                Dispute
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"
                >
                  {filteredDeals.map((deal, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={deal.dealId}
                      className="bg-white dark:bg-dark-card rounded-[32px] card-shadow p-8 border border-gray-50 dark:border-white/5 transition-all hover:border-brand-primary/50 group"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <StatusBadge status={deal.status} />
                        <span className="text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-widest">#{deal.dealId.slice(0, 8)}</span>
                      </div>

                      <div className="space-y-6 mb-8">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase mb-1">Counterparty</p>
                            <p className="text-sm font-black text-brand-dark dark:text-white truncate max-w-[120px]">
                              {accountId === deal.buyer ? deal.seller : deal.buyer}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase mb-1">Arbiter</p>
                            <p className="text-sm font-black text-brand-dark dark:text-white">{deal.arbiter}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-100 dark:border-white/5 group-hover:bg-brand-primary/5">
                          <p className="text-[10px] font-black text-brand-muted uppercase mb-2">Contract Value</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-brand-dark dark:text-white">{deal.amount.toLocaleString()}</span>
                            <span className="text-[10px] font-black bg-brand-primary text-brand-dark px-2 py-0.5 rounded-full">HBAR</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {deal.status === 'PENDING' && accountId === deal.buyer && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDepositFunds(deal)}
                            disabled={isDepositing === deal.dealId}
                            className="flex-1 bg-brand-primary text-brand-dark font-black text-xs py-4 rounded-2xl shadow-lg shadow-brand-primary/10 disabled:opacity-50"
                          >
                            {isDepositing === deal.dealId ? 'Processing' : 'Deposit Fund'}
                          </motion.button>
                        )}

                        {deal.status === 'FUNDED' && accountId === deal.buyer && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleReleaseFunds(deal)}
                            disabled={isReleasing === deal.dealId}
                            className="flex-1 bg-brand-dark dark:bg-brand-primary dark:text-brand-dark text-white font-black text-xs py-4 rounded-2xl shadow-lg disabled:opacity-50"
                          >
                            {isReleasing === deal.dealId ? 'Releasing' : 'Release Fund'}
                          </motion.button>
                        )}

                        {deal.status === 'FUNDED' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDispute(deal)}
                            disabled={isDisputing === deal.dealId}
                            className="px-6 bg-red-50 dark:bg-red-900/10 text-red-500 font-black text-[10px] py-4 rounded-2xl hover:bg-red-100"
                          >
                            Dispute
                          </motion.button>
                        )}

                        {deal.status === 'DISPUTED' && accountId === deal.arbiter && (
                          <div className="flex gap-2 w-full">
                            <button onClick={() => handleResolveDispute(deal, 'SELLER_PAID')} className="flex-1 bg-emerald-500 text-white font-black text-[10px] py-3 rounded-xl">Pay Seller</button>
                            <button onClick={() => handleResolveDispute(deal, 'BUYER_REFUNDED')} className="flex-1 bg-amber-500 text-white font-black text-[10px] py-3 rounded-xl">Refund</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </section>

        {/* --- History & Market Rates Side-by-Side --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-dark-card rounded-[32px] p-8 card-shadow border border-gray-100 dark:border-white/5"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black dark:text-white">Transaction Log</h3>
              <button className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-brand-primary/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-dark-card flex items-center justify-center shadow-sm">
                    <History size={16} className="text-brand-muted" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black dark:text-white">Escrow Payment</p>
                    <p className="text-[10px] font-bold text-brand-muted">Dec 28, 2025 • 14:30</p>
                  </div>
                  <p className="text-sm font-black text-emerald-500">+1,240 <span className="text-[10px]">HBAR</span></p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-dark-card rounded-[32px] p-8 card-shadow border border-gray-100 dark:border-white/5"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black dark:text-white">Market Insights</h3>
              <TrendingUp size={20} className="text-brand-primary" />
            </div>
            <div className="h-64 bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center group cursor-pointer overflow-hidden relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="z-10 text-center"
              >
                <Activity size={40} className="text-brand-primary/20 mb-4 mx-auto" />
                <span className="text-xs font-black text-brand-muted uppercase tracking-[0.2em]">Real-time chart incoming</span>
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        </div>
      </main>

      {/* --- Mobile Bottom Navigation --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-white/10 px-8 py-4 flex justify-between items-center z-40 pb-safe">
        {[
          { icon: LayoutDashboard, active: true },
          { icon: Briefcase },
          { icon: TrendingUp },
          { icon: Settings },
        ].map((item, i) => (
          <button key={i} className={`p-2 rounded-xl ${item.active ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-muted dark:text-gray-500'}`}>
            <item.icon size={24} />
          </button>
        ))}
      </nav>

      {/* --- Mobile FAB --- */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-brand-dark dark:bg-brand-primary text-brand-primary dark:text-brand-dark rounded-full shadow-2xl flex items-center justify-center z-50 border-4 border-white dark:border-dark-bg"
      >
        <Plus size={32} strokeWidth={3} />
      </motion.button>

      <CreateDealModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateDeal} isSubmitting={isSubmitting} />
    </motion.div>
  );
}
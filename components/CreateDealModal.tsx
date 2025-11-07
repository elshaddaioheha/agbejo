'use client';

import { useState } from 'react';
import { useWallet } from './WalletContext';
import { X, User, Award, Wallet, FileText, AlertCircle, Users, Plus, Trash2 } from 'lucide-react';
import { resolveAccountIdentifier, isValidAccountId, isValidHNSDomain } from '@/lib/hns';

interface CreateDealModalProps {
  onClose: () => void;
}

export const CreateDealModal = ({ onClose }: CreateDealModalProps) => {
  const { accountId, signAndExecuteTransaction, connected } = useWallet();
  const [seller, setSeller] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [arbiters, setArbiters] = useState<string[]>(['']);
  const [requiredVotes, setRequiredVotes] = useState('2');
  const [arbitrationMode, setArbitrationMode] = useState<'single' | 'multi'>('single');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [hasArbiterFee, setHasArbiterFee] = useState(false);
  const [arbiterFeeType, setArbiterFeeType] = useState<'percentage' | 'flat'>('flat');
  const [arbiterFeeAmount, setArbiterFeeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'recording' | 'done'>('form');
  const [resolvingSeller, setResolvingSeller] = useState(false);
  const [resolvingArbiter, setResolvingArbiter] = useState(false);
  const [resolvingArbiters, setResolvingArbiters] = useState<boolean[]>([]);
  const [assetType, setAssetType] = useState<'HBAR' | 'FUNGIBLE_TOKEN' | 'NFT'>('HBAR');
  const [assetId, setAssetId] = useState('');
  const [assetSerialNumber, setAssetSerialNumber] = useState('');

  const validateAccountId = (id: string): boolean => {
    return isValidAccountId(id);
  };

  const handleSellerBlur = async () => {
    if (!seller || isValidAccountId(seller)) return;
    
    if (isValidHNSDomain(seller) || seller.includes('.')) {
      setResolvingSeller(true);
      const network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'previewnet';
      const resolved = await resolveAccountIdentifier(seller, network);
      if (resolved) {
        setSeller(resolved);
      } else if (seller && !seller.includes('0.0.')) {
        setError(`Could not resolve "${seller}" to an account ID. Please check the domain name or use an account ID.`);
      }
      setResolvingSeller(false);
    }
  };

  const handleArbiterBlur = async () => {
    if (!arbiter || isValidAccountId(arbiter)) return;
    
    if (isValidHNSDomain(arbiter) || arbiter.includes('.')) {
      setResolvingArbiter(true);
      const network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'previewnet';
      const resolved = await resolveAccountIdentifier(arbiter, network);
      if (resolved) {
        setArbiter(resolved);
      } else if (arbiter && !arbiter.includes('0.0.')) {
        setError(`Could not resolve "${arbiter}" to an account ID. Please check the domain name or use an account ID.`);
      }
      setResolvingArbiter(false);
    }
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

    // Validate arbitration setup
    if (arbitrationMode === 'single') {
      if (!validateAccountId(arbiter)) {
        setError('Invalid arbiter account ID. Format: 0.0.xxxxx');
        return;
      }
    } else {
      // Multi-sig validation
      const validArbiters = arbiters.filter(a => a.trim().length > 0);
      if (validArbiters.length < 2) {
        setError('Multi-sig requires at least 2 arbiters');
        return;
      }
      
      for (const arb of validArbiters) {
        if (!validateAccountId(arb)) {
          setError(`Invalid arbiter account ID: ${arb}. Format: 0.0.xxxxx`);
          return;
        }
      }
      
      const requiredVotesNum = parseInt(requiredVotes);
      if (isNaN(requiredVotesNum) || requiredVotesNum < 1 || requiredVotesNum > validArbiters.length) {
        setError(`Required votes must be between 1 and ${validArbiters.length}`);
        return;
      }
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    // Validate arbiter fee if enabled
    let arbiterFeeTypeValue: 'percentage' | 'flat' | null = null;
    let arbiterFeeAmountValue = 0;
    
    if (hasArbiterFee) {
      const feeAmountNum = parseFloat(arbiterFeeAmount);
      if (isNaN(feeAmountNum) || feeAmountNum <= 0) {
        setError('Arbiter fee amount must be a positive number');
        return;
      }
      
      if (arbiterFeeType === 'percentage' && (feeAmountNum < 0 || feeAmountNum > 100)) {
        setError('Arbiter fee percentage must be between 0 and 100');
        return;
      }
      
      arbiterFeeTypeValue = arbiterFeeType;
      arbiterFeeAmountValue = feeAmountNum;
    }

    setIsLoading(true);
    setStep('recording');

    try {
      // No funds transfer - just create the proposal
      // Funds will be sent after both seller and arbiter accept

      const dealData: any = {
        buyer: accountId,
        seller,
        amount: amountNum,
        description,
        arbiterFeeType: arbiterFeeTypeValue,
        arbiterFeeAmount: arbiterFeeAmountValue,
        assetType,
        assetId: assetType !== 'HBAR' ? assetId : undefined,
        assetSerialNumber: assetType === 'NFT' && assetSerialNumber ? Number(assetSerialNumber) : undefined,
      };
      
      // Add arbitration setup based on mode
      if (arbitrationMode === 'single') {
        dealData.arbiter = arbiter;
      } else {
        dealData.arbiters = arbiters.filter(a => a.trim().length > 0);
        dealData.requiredVotes = parseInt(requiredVotes);
      }

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
      setArbiters(['']);
      setRequiredVotes('2');
      setArbitrationMode('single');
      setAmount('');
      setDescription('');
      setHasArbiterFee(false);
      setArbiterFeeType('flat');
      setArbiterFeeAmount('');
      
      alert('✅ Deal proposed successfully! The seller and arbiter must accept before funds are sent.');
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
                  {step === 'recording' && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Recording on blockchain...</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Creating deal proposal</p>
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
              <div className="relative">
                <input
                  type="text"
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  onBlur={handleSellerBlur}
                  placeholder="0.0.12345 or seller.hbar"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  required
                  disabled={isLoading || resolvingSeller}
                />
                {resolvingSeller && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter account ID (0.0.12345) or HNS name (seller.hbar)
              </p>
            </div>

            {/* Arbitration Mode Toggle */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
                  <Award size={16} className="text-white" />
                </div>
                Arbitration Type
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setArbitrationMode('single');
                    setArbiters(['']);
                    setRequiredVotes('2');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    arbitrationMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Award size={16} className="inline mr-2" />
                  Single Arbiter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setArbitrationMode('multi');
                    setArbiter('');
                    if (arbiters.length < 2) {
                      setArbiters(['', '']);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    arbitrationMode === 'multi'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Users size={16} className="inline mr-2" />
                  Multi-Sig Panel
                </button>
              </div>

              {arbitrationMode === 'single' ? (
                <div className="relative">
                  <input
                    type="text"
                    value={arbiter}
                    onChange={(e) => setArbiter(e.target.value)}
                    onBlur={handleArbiterBlur}
                    placeholder="0.0.67890 or arbiter.hbar"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    required
                    disabled={isLoading || resolvingArbiter}
                  />
                  {resolvingArbiter && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter account ID (0.0.67890) or HNS name (arbiter.hbar)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Add multiple arbiters for decentralized dispute resolution
                    </p>
                    <button
                      type="button"
                      onClick={() => setArbiters([...arbiters, ''])}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={14} />
                      Add Arbiter
                    </button>
                  </div>
                  
                  {arbiters.map((arb, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={arb}
                          onChange={(e) => {
                            const newArbiters = [...arbiters];
                            newArbiters[index] = e.target.value;
                            setArbiters(newArbiters);
                          }}
                          placeholder={`Arbiter ${index + 1} (0.0.xxxxx)`}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                          disabled={isLoading}
                        />
                      </div>
                      {arbiters.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newArbiters = arbiters.filter((_, i) => i !== index);
                            setArbiters(newArbiters);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Required Votes (out of {arbiters.filter(a => a.trim().length > 0).length || arbiters.length})
                    </label>
                    <input
                      type="number"
                      value={requiredVotes}
                      onChange={(e) => setRequiredVotes(e.target.value)}
                      min="1"
                      max={arbiters.length}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum votes needed to resolve disputes (e.g., 2-of-3, 3-of-5)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Asset Type Selector */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Wallet size={16} className="text-white" />
                </div>
                Asset Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAssetType('HBAR');
                    setAssetId('');
                    setAssetSerialNumber('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    assetType === 'HBAR'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                  }`}
                  disabled={isLoading}
                >
                  HBAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssetType('FUNGIBLE_TOKEN');
                    setAssetSerialNumber('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    assetType === 'FUNGIBLE_TOKEN'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                  }`}
                  disabled={isLoading}
                >
                  Token
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssetType('NFT');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    assetType === 'NFT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                  }`}
                  disabled={isLoading}
                >
                  NFT
                </button>
              </div>
            </div>

            {/* Token ID Input (for tokens and NFTs) */}
            {assetType !== 'HBAR' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                    <FileText size={16} className="text-white" />
                  </div>
                  Token ID
                </label>
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="0.0.123456"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  required={true}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the HTS token ID (e.g., 0.0.123456)
                </p>
              </div>
            )}

            {/* NFT Serial Number Input */}
            {assetType === 'NFT' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Award size={16} className="text-white" />
                  </div>
                  NFT Serial Number
                </label>
                <input
                  type="number"
                  value={assetSerialNumber}
                  onChange={(e) => setAssetSerialNumber(e.target.value)}
                  placeholder="1"
                  min="1"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  required={assetType === 'NFT'}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the serial number of the NFT
                </p>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Wallet size={16} className="text-white" />
                </div>
                Amount {assetType === 'HBAR' ? '(HBAR)' : assetType === 'NFT' ? '(NFT Serial #)' : '(Token Units)'}
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

            {/* Arbiter Fee Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Award size={16} className="text-slate-600 dark:text-slate-400" />
                  Arbiter Fee (Optional)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasArbiterFee}
                    onChange={(e) => setHasArbiterFee(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Enable</span>
                </label>
              </div>

              {hasArbiterFee && (
                <div className="space-y-3 mt-3">
                  {/* Fee Type Selection */}
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Fee Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setArbiterFeeType('flat')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          arbiterFeeType === 'flat'
                            ? 'bg-slate-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                        }`}
                        disabled={isLoading}
                      >
                        Flat (HBAR)
                      </button>
                      <button
                        type="button"
                        onClick={() => setArbiterFeeType('percentage')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          arbiterFeeType === 'percentage'
                            ? 'bg-slate-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                        }`}
                        disabled={isLoading}
                      >
                        Percentage (%)
                      </button>
                    </div>
                  </div>

                  {/* Fee Amount Input */}
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Fee Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={arbiterFeeAmount}
                        onChange={(e) => setArbiterFeeAmount(e.target.value)}
                        step="0.01"
                        min="0.01"
                        max={arbiterFeeType === 'percentage' ? '100' : undefined}
                        placeholder={arbiterFeeType === 'percentage' ? '5' : '1.0'}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                        disabled={isLoading}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                        {arbiterFeeType === 'percentage' ? '%' : 'ℏ'}
                      </div>
                    </div>
                  </div>

                  {/* Fee Preview */}
                  {arbiterFeeAmount && parseFloat(arbiterFeeAmount) > 0 && amount && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <span className="font-semibold">Estimated Fee: </span>
                        {arbiterFeeType === 'percentage'
                          ? `${((parseFloat(amount) * parseFloat(arbiterFeeAmount)) / 100).toFixed(2)} ℏ (${arbiterFeeAmount}% of ${amount} ℏ)`
                          : `${parseFloat(arbiterFeeAmount).toFixed(2)} ℏ flat fee`}
                      </p>
                    </div>
                  )}
                </div>
              )}
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
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { seller: string; arbiter: string; amount: number }) => void;
  isSubmitting: boolean;
}

const CreateDealModal = ({ isOpen, onClose, onSubmit, isSubmitting }: CreateDealModalProps) => {
  const [seller, setSeller] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller || !arbiter || !amount || Number(amount) <= 0) {
      alert("Please fill in all fields with valid values.");
      return;
    }
    onSubmit({ seller, arbiter, amount: Number(amount) });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/40 dark:bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-dark-card rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden p-10 lg:p-14 border border-gray-100 dark:border-white/10"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary" />

            <div className="mb-10">
              <h2 className="text-4xl font-black text-brand-dark dark:text-white tracking-tighter mb-4">Create New Deal</h2>
              <p className='text-brand-muted dark:text-gray-400 font-medium text-lg leading-relaxed'>
                Deploy a new decentralized escrow contract on Hedera. Funds will be held securely until terms are met.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Seller Account ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 0.0.12345"
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    className="w-full px-6 py-5 bg-gray-50 dark:bg-white/5 dark:text-white border-none rounded-[24px] text-lg font-bold focus:ring-4 focus:ring-brand-primary/20 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Arbiter Account ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 0.0.67890"
                    value={arbiter}
                    onChange={(e) => setArbiter(e.target.value)}
                    className="w-full px-6 py-5 bg-gray-50 dark:bg-white/5 dark:text-white border-none rounded-[24px] text-lg font-bold focus:ring-4 focus:ring-brand-primary/20 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-brand-muted dark:text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">HBAR Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-6 py-5 bg-gray-50 dark:bg-white/5 dark:text-white border-none rounded-[24px] text-3xl font-black focus:ring-4 focus:ring-brand-primary/20 transition-all outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700"
                      required
                      min="0.00000001"
                      step="0.00000001"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-brand-dark dark:bg-brand-primary text-brand-primary dark:text-brand-dark px-4 py-1.5 rounded-full font-black text-xs">HBAR</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-8 py-5 rounded-[24px] bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-brand-dark dark:text-white font-black text-lg transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] px-8 py-5 rounded-[24px] bg-brand-dark dark:bg-brand-primary text-white dark:text-brand-dark font-black text-lg shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-4 border-white dark:border-brand-dark border-t-transparent rounded-full animate-spin" />
                      Deploying...
                    </>
                  ) : 'Deploy Contract'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateDealModal;

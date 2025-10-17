'use client';
import { useState } from 'react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller || !arbiter || !amount || Number(amount) <= 0) {
        alert("Please fill in all fields with valid values.");
        return;
    }
    onSubmit({ seller, arbiter, amount: Number(amount) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Create New Deal</h2>
        <p className='text-sm text-slate-500 dark:text-slate-400 mb-6'>
          Enter the Hedera account IDs for the seller and a trusted arbiter. Once the deal is created, you&apos;ll be prompted to deposit the funds.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input type="text" placeholder="Seller Account ID (e.g., 0.0.12345)" value={seller} onChange={(e) => setSeller(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-md" required />
            <input type="text" placeholder="Arbiter Account ID (e.g., 0.0.67890)" value={arbiter} onChange={(e) => setArbiter(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-md" required />
            <input type="number" placeholder="Amount in HBAR" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-md" required min="0.00000001" step="0.00000001" />
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 font-semibold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Create Deal'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDealModal;

'use client';

import { useState } from 'react';
import { useWallet } from './WalletProvider';
import { toast } from 'react-toastify';
import { Client, AccountId, PrivateKey, Hbar, TransferTransaction } from '@hashgraph/sdk';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateDealModal: React.FC<CreateDealModalProps> = ({ isOpen, onClose }) => {
  const { provider, account } = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const client = provider as Client;
      const privateKey = PrivateKey.fromString(process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY || '');
      client.setOperator(AccountId.fromString(account), privateKey);

      // Convert amount to tinybar (Hedera's smallest unit)
      const amountInTinybar = Hbar.fromString(amount).toTinybars();

      // Example transfer: Send HBAR to a recipient (replace with your deal logic, e.g., escrow contract)
      const recipientId = AccountId.fromString(process.env.NEXT_PUBLIC_HEDERA_RECIPIENT_ID || '0.0.123456'); // Placeholder recipient
      const transferTx = await new TransferTransaction()
        .addHbarTransfer(account, -amountInTinybar)
        .addHbarTransfer(recipientId, amountInTinybar)
        .execute(client);

      const txRecord = await transferTx.getRecord(client);
      console.log('Transaction status:', txRecord.transactionId.toString());

      toast.success('Deal created successfully!');
      setTitle('');
      setDescription('');
      setAmount('');
      onClose();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Create New Deal</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={4}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount (HBAR)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDealModal;

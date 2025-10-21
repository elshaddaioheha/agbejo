'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './WalletProvider';
import { Client, ContractCallQuery, ContractId } from '@hashgraph/sdk';

interface Deal {
  id: number;
  title: string;
  description: string;
  amount: string;
  creator: string;
}

const DealsList: React.FC = () => {
  const { provider, account } = useWallet();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDeals = async () => {
      if (!provider || !account) return;

      setIsLoading(true);
      try {
        const client = provider as Client;

        // Example: Query a Hedera smart contract for deals (replace with your contract details)
        const contractId = ContractId.fromString(process.env.NEXT_PUBLIC_HEDERA_CONTRACT_ID || '0.0.123456');
        const query = new ContractCallQuery()
          .setContractId(contractId)
          .setGas(100000) // Adjust gas as needed
          .setFunction('getDeals', null); // Assume 'getDeals' function returns an array of deals

        const result = await query.execute(client);

        // Parse the result (assuming contract returns a struct array; adjust based on your ABI equivalent)
        // This is a placeholder parser - use @hashgraph/sdk's result parsing methods
        const fetchedDeals: Deal[] = []; // Populate based on result, e.g.:
        // for (let i = 0; i < result.getUint256(0); i++) {
        //   fetchedDeals.push({
        //     id: result.getUint256(1 + i * 4),
        //     title: result.getString(2 + i * 4),
        //     // etc.
        //   });
        // }

        // For now, use mock data if contract not deployed
        const mockDeals: Deal[] = [
          { id: 1, title: 'Test Deal 1', description: 'A sample deal on Hedera', amount: '1.0', creator: account },
          { id: 2, title: 'Test Deal 2', description: 'Another deal on Hedera', amount: '2.5', creator: account },
        ];
        setDeals(mockDeals || fetchedDeals);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, [provider, account]);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Available Deals</h2>
      {isLoading ? (
        <p>Loading deals...</p>
      ) : deals.length === 0 ? (
        <p>No deals available.</p>
      ) : (
        <div className="grid gap-4">
          {deals.map(deal => (
            <div key={deal.id} className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold">{deal.title}</h3>
              <p className="text-gray-600">{deal.description}</p>
              <p className="mt-2">Amount: {deal.amount} HBAR</p>
              <p>Creator: {deal.creator}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DealsList;

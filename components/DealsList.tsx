'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './WalletProvider';
import { Client, ContractCallQuery, ContractId } from '@hashgraph/sdk';
import { toast } from 'react-toastify';

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
  const [page, setPage] = useState(1); 
  const pageSize = 10;

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
          .setFunction('getDeals', new ContractFunctionParameters()
            .addUint256((page - 1) * pageSize)  // Start index
            .addUint256(pageSize));  // Limit

        const result = await query.execute(client);

        // Parse the result (assuming contract returns a struct array; adjust based on your ABI equivalent)
        // This is a placeholder parser - use @hashgraph/sdk's result parsing methods
        const dealCount = result.getUint256(0);
        const fetchedDeals: Deal[] = [];
        for (let i = 0; i < dealCount.toNumber(); i++) {
          const offset = 1 + i * 5;
          fetchedDeals.push({
            id: result.getUint256(offset).toNumber(),
            title: result.getString(offset + 1),
            description: result.getString(offset + 2),
            amount: Hbar.fromTinybars(result.getInt64(offset + 3)).toString(),
            creator: result.getAddress(offset + 4),
          });
        }

        const filteredDeals = fetchedDeals.filter(deal => deal.creator === account);
        setDeals(filteredDeals.length > 0 ? filteredDeals : mockDeals);
        
        // For now, use mock data if contract not deployed
        const mockDeals: Deal[] = [
          { id: 1, title: 'Test Deal 1', description: 'A sample deal on Hedera', amount: '1.0', creator: account },
          { id: 2, title: 'Test Deal 2', description: 'Another deal on Hedera', amount: '2.5', creator: account },
        ];
        setDeals(mockDeals || fetchedDeals);
      } catch (error) {
        console.error('Error fetching deals:', error);
        console.error('Error fetching deals:', error);
        toast.error('Failed to fetch deals. Showing mock data.');
        setDeals(mockDeals);
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <button onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DealsList;

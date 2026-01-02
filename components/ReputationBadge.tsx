'use client';

import { useEffect, useState } from 'react';
import { Award, TrendingUp } from 'lucide-react';

interface ReputationBadgeProps {
  accountId: string;
  type: 'seller' | 'arbiter';
  className?: string;
}

export const ReputationBadge = ({ accountId, type, className = '' }: ReputationBadgeProps) => {
  const [reputation, setReputation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }

    const fetchReputation = async () => {
      try {
        const response = await fetch(`/api/reputation?accountId=${accountId}&type=${type}`);
        if (response.ok) {
          const data = await response.json();
          setReputation(data.reputation || 0);
        } else {
          setReputation(0);
        }
      } catch (error) {
        console.error('Error fetching reputation:', error);
        setReputation(0);
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
  }, [accountId, type]);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs ${className}`}>
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const count = reputation || 0;
  const label = type === 'seller' ? 'Deals' : 'Resolved';

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs ${className}`}>
      <Award size={12} className="text-blue-600 dark:text-blue-400" />
      <span className="font-semibold text-blue-900 dark:text-blue-100">{count}</span>
      <span className="text-blue-700 dark:text-blue-300">{label}</span>
    </div>
  );
};


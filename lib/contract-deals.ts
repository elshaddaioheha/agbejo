/**
 * Contract-based deal fetching
 * Fetches deals directly from the smart contract
 */

import { contractUtils } from './contract';
import { initDatabase, getAllDeals } from './db';

// Track known deal IDs (in production, this would come from events or database)
// For server-side, we'll use database if available, otherwise in-memory
let knownDealIds: string[] = [];

/**
 * Get all deals from the contract
 * Since the contract doesn't have getAllDeals, we:
 * 1. Check database for deal IDs (if available)
 * 2. Check known deal IDs (in-memory)
 * 3. Try to fetch from contract events (future enhancement)
 * 4. Return deals fetched from contract
 */
export async function getAllDealsFromContract(): Promise<any[]> {
  const deals: any[] = [];
  const dealIdsToFetch: string[] = [];
  
  // Try to get deal IDs from database first
  try {
    if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      await initDatabase();
      const dbDeals = await getAllDeals();
      dealIdsToFetch.push(...dbDeals.map(d => d.dealId));
    }
  } catch (dbError) {
    // Database not available, continue with in-memory list
    console.debug('Database not available for deal IDs, using in-memory list');
  }
  
  // Add in-memory tracked deal IDs
  dealIdsToFetch.push(...knownDealIds);
  
  // Remove duplicates
  const uniqueDealIds = [...new Set(dealIdsToFetch)];
  
  // Fetch each deal from contract
  for (const dealId of uniqueDealIds) {
    if (!dealId) continue;
    
    try {
      const deal = await contractUtils.getDeal(dealId);
      if (deal && deal.dealId) {
        deals.push(deal);
      }
    } catch (error) {
      // Deal might not exist anymore, skip it
      console.debug(`Deal ${dealId} not found in contract, skipping`);
    }
  }
  
  return deals;
}

/**
 * Add a deal ID to the tracking list
 * This should be called when a deal is created
 * On server-side, this is in-memory only (database is the source of truth)
 */
export function trackDealId(dealId: string) {
  if (!knownDealIds.includes(dealId)) {
    knownDealIds.push(dealId);
  }
  
  // On client-side, also persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('agbejo_deal_ids');
      const storedIds = stored ? JSON.parse(stored) : [];
      if (!storedIds.includes(dealId)) {
        storedIds.push(dealId);
        localStorage.setItem('agbejo_deal_ids', JSON.stringify(storedIds));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

/**
 * Load tracked deal IDs from storage
 */
export function loadTrackedDealIds(): string[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('agbejo_deal_ids');
      if (stored) {
        knownDealIds = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  return knownDealIds;
}

/**
 * Initialize - load deal IDs from storage
 */
export function initDealTracking() {
  loadTrackedDealIds();
}


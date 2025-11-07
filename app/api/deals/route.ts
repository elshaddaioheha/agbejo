import { NextResponse } from 'next/server';
import { getAllDeals, dbRowToDeal, initDatabase } from '@/lib/db';
import { getAllDealsFromContract, initDealTracking } from '@/lib/contract-deals';
import agbejo from '@/lib/agbejo';

export async function GET() {
  try {
    // Initialize deal tracking
    initDealTracking();
    
    // Try to fetch from contract first (new contract-based system)
    try {
      const contractDeals = await getAllDealsFromContract();
      if (contractDeals.length > 0) {
        console.log(`Fetched ${contractDeals.length} deals from contract`);
        return NextResponse.json(contractDeals);
      }
    } catch (contractError: any) {
      console.warn('Contract fetch failed, trying database/HCS:', contractError.message || contractError);
    }
    
    // Try to fetch from database (much faster)
    try {
      // Check if DATABASE_URL is available
      if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        // Database not configured - this is normal for initial setup
        // Silently fall through to HCS fallback
        throw new Error('Database not configured');
      }
      
      await initDatabase();
      const dbDeals = await getAllDeals();
      
      if (dbDeals.length > 0) {
        // Convert database rows to deal format
        const deals = dbDeals.map(dbRowToDeal);
        return NextResponse.json(deals);
      }
    } catch (dbError: any) {
      // Database not configured or unavailable - this is expected
      // Only log if it's an actual error (not just missing config)
      if (dbError?.message !== 'Database not configured') {
        console.warn('Database fetch failed, falling back to HCS:', dbError.message || dbError);
      }
      // Fallback to HCS if database is not available
    }

    // Fallback: fetch from HCS (slower but always works)
    const deals = await agbejo.getDeals();
    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

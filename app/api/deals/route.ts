import { NextResponse } from 'next/server';
import { getAllDeals, dbRowToDeal, initDatabase } from '@/lib/db';
import agbejo from '@/lib/agbejo';

export async function GET() {
  try {
    // Try to fetch from database first (much faster)
    try {
      // Check if DATABASE_URL is available
      if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        throw new Error('Database not configured');
      }
      
      await initDatabase();
      const dbDeals = await getAllDeals();
      
      if (dbDeals.length > 0) {
        // Convert database rows to deal format
        const deals = dbDeals.map(dbRowToDeal);
        return NextResponse.json(deals);
      }
    } catch (dbError) {
      console.warn('Database fetch failed, falling back to HCS:', dbError);
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

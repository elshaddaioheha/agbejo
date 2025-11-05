import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';
import { upsertDeal, initDatabase } from '@/lib/db';

/**
 * Sync endpoint - fetches all deals from HCS and updates database
 * This should be called periodically (via cron job or webhook)
 */
export async function POST(request: Request) {
  try {
    // Initialize database if needed
    await initDatabase();

    // Fetch all deals from HCS
    const deals = await agbejo.getDeals();

    // Upsert all deals into database
    for (const deal of deals) {
      await upsertDeal({
        dealId: deal.dealId,
        buyer: deal.buyer,
        seller: deal.seller,
        arbiter: deal.arbiter,
        amount: deal.amount,
        status: deal.status,
        createdAt: deal.createdAt,
        sellerAccepted: deal.sellerAccepted || false,
        arbiterAccepted: deal.arbiterAccepted || false,
        description: deal.description || '',
        arbiterFeeType: deal.arbiterFeeType || null,
        arbiterFeeAmount: deal.arbiterFeeAmount || 0,
        assetType: deal.assetType || 'HBAR',
        assetId: deal.assetId,
        assetSerialNumber: deal.assetSerialNumber,
      });
    }

    return NextResponse.json({ 
      success: true, 
      synced: deals.length 
    });
  } catch (error) {
    console.error('Error syncing deals:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET endpoint for manual sync trigger
export async function GET() {
  return POST(new Request('http://localhost', { method: 'POST' }));
}


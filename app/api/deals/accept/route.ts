import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';
import { getDealById, upsertDeal, initDatabase, dbRowToDeal } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { dealId, role } = await request.json();
    if (!dealId || !role) {
      return NextResponse.json({ error: 'Missing required fields: dealId and role.' }, { status: 400 });
    }

    if (role === 'seller') {
      await agbejo.acceptDealAsSeller(dealId);
    } else if (role === 'arbiter') {
      await agbejo.acceptDealAsArbiter(dealId);
    } else {
      return NextResponse.json({ error: 'Invalid role. Must be "seller" or "arbiter".' }, { status: 400 });
    }

    // Sync to database immediately
    try {
      await initDatabase();
      // Fetch updated deal from HCS and sync to DB
      const deals = await agbejo.getDeals();
      const updatedDeal = deals.find(d => d.dealId === dealId);
      if (updatedDeal) {
        await upsertDeal({
          dealId: updatedDeal.dealId,
          buyer: updatedDeal.buyer,
          seller: updatedDeal.seller,
          arbiter: updatedDeal.arbiter,
          amount: updatedDeal.amount,
          status: updatedDeal.status,
          createdAt: updatedDeal.createdAt,
          sellerAccepted: updatedDeal.sellerAccepted || false,
          arbiterAccepted: updatedDeal.arbiterAccepted || false,
          description: updatedDeal.description || '',
          arbiterFeeType: updatedDeal.arbiterFeeType || null,
          arbiterFeeAmount: updatedDeal.arbiterFeeAmount || 0,
        });
      }
    } catch (dbError) {
      console.warn('Failed to sync deal to database:', dbError);
      // Continue even if database sync fails
    }

    return NextResponse.json({ message: 'Deal accepted successfully!' });
  } catch (error) {
    console.error('Error accepting deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


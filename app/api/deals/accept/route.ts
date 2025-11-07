import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';
import { getDealById, upsertDeal, initDatabase, dbRowToDeal } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { dealId, role, accountId } = await request.json();
    if (!dealId || !role || !accountId) {
      return NextResponse.json({ error: 'Missing required fields: dealId, role, and accountId.' }, { status: 400 });
    }

    let contractStatus: string;
    
    if (role === 'seller') {
      // Seller accepts the deal
      contractStatus = await contractUtils.acceptAsSeller(dealId, accountId);
    } else if (role === 'arbiter') {
      // Arbiter accepts the deal
      contractStatus = await contractUtils.acceptAsArbiter(dealId, accountId);
    } else {
      return NextResponse.json({ error: 'Invalid role. Must be "seller" or "arbiter".' }, { status: 400 });
    }
    
    // Check if contract transaction was successful
    if (contractStatus !== 'SUCCESS') {
      return NextResponse.json({ 
        error: `Contract transaction failed with status: ${contractStatus}` 
      }, { status: 500 });
    }

    // Sync to database immediately (if configured)
    try {
      if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
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
          assetType: updatedDeal.assetType || 'HBAR',
          assetId: updatedDeal.assetId,
          assetSerialNumber: updatedDeal.assetSerialNumber,
          });
        }
      }
    } catch (dbError) {
      // Silently ignore database sync errors - not critical
      console.debug('Database sync skipped or failed (non-critical):', dbError instanceof Error ? dbError.message : 'Unknown error');
      // Continue even if database sync fails
    }

    return NextResponse.json({ message: 'Deal accepted successfully!' });
  } catch (error) {
    console.error('Error accepting deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';
import { upsertDeal, initDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { seller, arbiter, amount, buyer, description, arbiterFeeType, arbiterFeeAmount, assetType, assetId, assetSerialNumber } = await request.json();
    if (!seller || !arbiter || !amount || !buyer) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    
    // Validate arbiter fee if provided
    if (arbiterFeeType && arbiterFeeAmount) {
      if (arbiterFeeType === 'percentage' && (arbiterFeeAmount < 0 || arbiterFeeAmount > 100)) {
        return NextResponse.json({ error: 'Arbiter fee percentage must be between 0 and 100.' }, { status: 400 });
      }
      if (arbiterFeeType === 'flat' && arbiterFeeAmount < 0) {
        return NextResponse.json({ error: 'Arbiter fee must be positive.' }, { status: 400 });
      }
    }
    
    const dealId = await agbejo.createDeal(
      buyer, 
      seller, 
      arbiter, 
      Number(amount), 
      description, 
      arbiterFeeType || null, 
      arbiterFeeAmount ? Number(arbiterFeeAmount) : 0,
      assetType || 'HBAR',
      assetId,
      assetSerialNumber ? Number(assetSerialNumber) : undefined
    );

    // Sync to database immediately (if configured)
    try {
      if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        // Database not configured - skip sync
        return NextResponse.json({ message: 'Deal proposed successfully!', dealId });
      }
      
      await initDatabase();
      await upsertDeal({
        dealId,
        buyer,
        seller,
        arbiter,
        amount: Number(amount),
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
        sellerAccepted: false,
        arbiterAccepted: false,
        description: description || '',
        arbiterFeeType: arbiterFeeType || null,
        arbiterFeeAmount: arbiterFeeAmount ? Number(arbiterFeeAmount) : 0,
        assetType: assetType || 'HBAR',
        assetId: assetId || undefined,
        assetSerialNumber: assetSerialNumber ? Number(assetSerialNumber) : undefined,
      });
    } catch (dbError) {
      // Silently ignore database sync errors - not critical
      console.debug('Database sync skipped or failed (non-critical):', dbError instanceof Error ? dbError.message : 'Unknown error');
      // Continue even if database sync fails
    }

    return NextResponse.json({ message: 'Deal proposed successfully!', dealId });
  } catch (error) {
    console.error('Error creating deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
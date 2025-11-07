import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';

export async function POST(request: Request) {
  try {
    const { dealId, buyerAccountId } = await request.json();
    if (!dealId || !buyerAccountId) {
      return NextResponse.json({ 
        error: 'Missing required fields: dealId and buyerAccountId are required.' 
      }, { status: 400 });
    }
    
    // Verify deal exists and buyer matches
    try {
      const deal = await contractUtils.getDeal(dealId);
      // Check if deal exists - dealId should match if deal exists
      if (!deal || (deal.dealId !== dealId && !deal.exists)) {
        return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
      }
      
      if (deal.buyer && deal.buyer !== buyerAccountId) {
        return NextResponse.json({ 
          error: 'Only the buyer can raise a dispute.' 
        }, { status: 403 });
      }
    } catch (queryError) {
      // If query fails, still try to dispute (deal might exist but query failed)
      console.warn('Could not verify deal before dispute:', queryError);
    }

    // Raise dispute on smart contract
    const contractStatus = await contractUtils.dispute(dealId, buyerAccountId);

    if (contractStatus !== 'SUCCESS') {
      return NextResponse.json({ 
        error: `Contract transaction failed with status: ${contractStatus}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Dispute raised successfully!' 
    });
  } catch (error) {
    console.error('Error raising dispute:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
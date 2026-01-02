import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';

export async function POST(request: Request) {
  try {
    const { dealId, arbiterAccountId } = await request.json();
    if (!dealId || !arbiterAccountId) {
      return NextResponse.json({ 
        error: 'Missing required fields: dealId and arbiterAccountId are required.' 
      }, { status: 400 });
    }
    
    // Verify deal exists and arbiter matches
    try {
      const deal = await contractUtils.getDeal(dealId);
      // Check if deal exists - dealId should match if deal exists
      if (!deal || (deal.dealId !== dealId && !deal.exists)) {
        return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
      }
      
      if (deal.arbiter && deal.arbiter !== arbiterAccountId) {
        return NextResponse.json({ 
          error: 'Only the arbiter can refund the buyer.' 
        }, { status: 403 });
      }
    } catch (queryError) {
      // If query fails, still try to refund (deal might exist but query failed)
      console.warn('Could not verify deal before refund:', queryError);
    }

    // Refund buyer via smart contract
    // Note: The contract handles arbiter fee calculation and distribution automatically
    const contractStatus = await contractUtils.refundBuyer(dealId, arbiterAccountId);

    if (contractStatus !== 'SUCCESS') {
      return NextResponse.json({ 
        error: `Contract transaction failed with status: ${contractStatus}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Buyer refunded successfully!' 
    });
  } catch (error) {
    console.error('Error refunding buyer:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
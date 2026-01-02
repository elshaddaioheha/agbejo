import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';

export async function POST(request: Request) {
  try {
    const { dealId, arbiterAccountId, releaseToSeller } = await request.json();
    if (!dealId || !arbiterAccountId || typeof releaseToSeller !== 'boolean') {
      return NextResponse.json({ 
        error: 'Missing required fields: dealId, arbiterAccountId, and releaseToSeller are required.' 
      }, { status: 400 });
    }
    
    // Verify deal exists and is in DISPUTED status
    try {
      const deal = await contractUtils.getDeal(dealId);
      if (!deal || (deal.dealId !== dealId && !deal.exists)) {
        return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
      }
      
      if (deal.status !== 'DISPUTED') {
        return NextResponse.json({ 
          error: 'Deal must be in DISPUTED status to vote.' 
        }, { status: 400 });
      }
    } catch (queryError) {
      console.warn('Could not verify deal before voting:', queryError);
    }

    // Vote on dispute via smart contract
    const contractStatus = await contractUtils.voteOnDispute(dealId, releaseToSeller, arbiterAccountId);

    if (contractStatus !== 'SUCCESS') {
      return NextResponse.json({ 
        error: `Contract transaction failed with status: ${contractStatus}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Vote submitted successfully!' 
    });
  } catch (error) {
    console.error('Error voting on dispute:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


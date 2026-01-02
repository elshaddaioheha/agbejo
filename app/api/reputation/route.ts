import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const type = searchParams.get('type'); // 'seller' or 'arbiter'
    
    if (!accountId || !type) {
      return NextResponse.json({ 
        error: 'Missing required parameters: accountId and type (seller|arbiter)' 
      }, { status: 400 });
    }
    
    if (type !== 'seller' && type !== 'arbiter') {
      return NextResponse.json({ 
        error: 'Type must be either "seller" or "arbiter"' 
      }, { status: 400 });
    }
    
    // Get reputation from contract
    const reputation = type === 'seller' 
      ? await contractUtils.getSellerReputation(accountId)
      : await contractUtils.getArbiterReputation(accountId);

    return NextResponse.json({ 
      ok: true, 
      accountId,
      type,
      reputation
    });
  } catch (error) {
    console.error('Error getting reputation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


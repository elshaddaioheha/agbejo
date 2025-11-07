import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    
    if (!dealId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: dealId' 
      }, { status: 400 });
    }
    
    // Get voting status from contract
    const votingStatus = await contractUtils.getVotingStatus(dealId);

    return NextResponse.json({ 
      ok: true, 
      ...votingStatus
    });
  } catch (error) {
    console.error('Error getting voting status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


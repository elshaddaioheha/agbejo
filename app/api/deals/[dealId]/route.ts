import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';

export async function GET(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  try {
    const { dealId } = params;
    
    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required.' }, { status: 400 });
    }

    // Query deal from smart contract
    const deal = await contractUtils.getDeal(dealId);

    // Check if deal exists - dealId should match if deal exists
    if (!deal || (deal.dealId !== dealId && !deal.exists)) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


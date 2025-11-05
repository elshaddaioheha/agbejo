import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId, seller, amount } = await request.json();
    if (!dealId || !seller || !amount) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    
    // Fetch the deal to get arbiter fee information
    const deals = await agbejo.getDeals();
    const deal = deals.find(d => d.dealId === dealId);
    
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    // Calculate arbiter fee if configured
    const arbiterFee = agbejo.calculateArbiterFee(deal);
    const arbiterAccountId = arbiterFee > 0 ? deal.arbiter : undefined;

    await agbejo.releaseFunds(
      seller, 
      dealId, 
      Number(amount), 
      arbiterAccountId, 
      arbiterFee,
      deal.assetType || 'HBAR',
      deal.assetId,
      deal.assetSerialNumber
    );
    return NextResponse.json({ ok: true, arbiterFeePaid: arbiterFee });
  } catch (error) {
    console.error('Error paying seller:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { seller, arbiter, amount, buyer } = await request.json();

    // Basic validation
    if (!seller || !arbiter || !amount || !buyer) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Call our secure backend function to create the deal on Hedera
    let newDealTimestamp: string | number | null = null;
    try {
      newDealTimestamp = await agbejo.createDeal(
          buyer, 
          seller, 
          arbiter, 
          Number(amount)
      );
    } catch (primaryError: any) {
      console.warn('[create] Primary method failed, attempting fallback...', primaryError?.message || primaryError);
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const legacy = require('@/lib/agbejobackendre.js');
        if (typeof legacy.createDeal !== 'function') throw new Error('Fallback helper missing createDeal');
        newDealTimestamp = await legacy.createDeal(buyer, seller, arbiter, Number(amount));
      } catch (fallbackError: any) {
        console.error('[create] Fallback also failed', fallbackError?.message || fallbackError);
        const message = String(primaryError?.message || fallbackError?.message || 'Failed to create deal');
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    return NextResponse.json({ 
        message: 'Deal created successfully!', 
        timestamp: newDealTimestamp 
    });

  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Failed to create deal.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { seller, arbiter, amount, buyer } = await request.json();

    if (!seller || !arbiter || !amount || !buyer) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const newDealTimestamp = await agbejo.createDeal(
        buyer,
        seller,
        arbiter,
        Number(amount)
    );

    return NextResponse.json({
        message: 'Deal created successfully!',
        timestamp: newDealTimestamp
    });

  } catch (error) {
    console.error('Error creating deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId, buyer, amount } = await request.json();
    if (!dealId || !buyer || !amount) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    await agbejo.refundBuyer(buyer, dealId, Number(amount));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error refunding buyer:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getOnRampUrl } from '@/lib/fiat-onramp';

export async function POST(request: Request) {
  try {
    const { amount, currency, walletAddress, dealId, provider } = await request.json();

    if (!amount || !currency || !walletAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields: amount, currency, and walletAddress are required.' 
      }, { status: 400 });
    }

    const result = getOnRampUrl(
      {
        amount: Number(amount),
        currency,
        walletAddress,
        dealId,
      },
      provider || 'auto'
    );

    return NextResponse.json({
      ok: true,
      url: result.url,
      provider: result.provider,
    });
  } catch (error) {
    console.error('Error generating on-ramp URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId, role } = await request.json();
    if (!dealId || !role) {
      return NextResponse.json({ error: 'Missing required fields: dealId and role.' }, { status: 400 });
    }

    if (role === 'seller') {
      await agbejo.acceptDealAsSeller(dealId);
    } else if (role === 'arbiter') {
      await agbejo.acceptDealAsArbiter(dealId);
    } else {
      return NextResponse.json({ error: 'Invalid role. Must be "seller" or "arbiter".' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Deal accepted successfully!' });
  } catch (error) {
    console.error('Error accepting deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


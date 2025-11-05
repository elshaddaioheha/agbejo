import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId } = await request.json();
    if (!dealId) {
      return NextResponse.json({ error: 'Missing required field: dealId.' }, { status: 400 });
    }

    await agbejo.markDealAsFunded(dealId);
    return NextResponse.json({ message: 'Deal funded successfully!' });
  } catch (error) {
    console.error('Error marking deal as funded:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


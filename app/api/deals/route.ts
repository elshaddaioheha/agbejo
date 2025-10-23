import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function GET() {
  try {
    // The logic to fetch and process deals is now cleanly inside your agbejo library
    const deals = await agbejo.getDeals();
    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId, status, type } = await request.json();
    if (!dealId || !status || !type) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    await agbejo.updateStatus(dealId, status, type);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error updating status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
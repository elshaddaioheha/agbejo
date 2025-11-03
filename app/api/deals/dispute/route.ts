import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId } = await request.json();
    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId.' }, { status: 400 });
    }
    await agbejo.updateStatus(dealId, 'DISPUTED', 'DISPUTE');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error disputing deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
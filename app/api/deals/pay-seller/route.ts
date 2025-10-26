<<<<<<< HEAD
import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId, seller, amount } = await request.json();
    if (!dealId || !seller || !amount) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    await agbejo.releaseFunds(seller, dealId, Number(amount));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error paying seller:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
=======
import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId, seller, amount } = await request.json();
    if (!dealId || !seller || !amount) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    await agbejo.releaseFunds(seller, dealId, Number(amount));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error paying seller:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
>>>>>>> 9af1f97de3807a620a6cf18a02538ca3ef3a22ec
}
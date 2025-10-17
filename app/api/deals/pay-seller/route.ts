import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
  try {
    const { dealId, seller, amount } = await request.json();
    if (!dealId || !seller || (typeof amount !== 'number' && typeof amount !== 'string')) {
      return badRequest('Missing required fields. Provide dealId, seller, amount(number).');
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return badRequest('Invalid amount.');

    try {
      await agbejo.releaseFunds(seller, dealId, amt);
      return NextResponse.json({ ok: true });
    } catch (primaryError: any) {
      console.warn('[pay-seller] Primary method failed, attempting fallback...', primaryError?.message || primaryError);
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const legacy = require('@/lib/agbejobackendre.js');
        if (typeof legacy.releaseFunds !== 'function') throw new Error('Fallback helper missing releaseFunds');
        await legacy.releaseFunds(seller, dealId, amt);
        try {
          await agbejo.updateStatus(dealId, 'SELLER_PAID', 'RELEASE_FUNDS');
        } catch (statusErr) {
          console.warn('[pay-seller] Status update failed after fallback transfer', statusErr);
        }
        return NextResponse.json({ ok: true, fallback: true });
      } catch (fallbackError: any) {
        console.error('[pay-seller] Fallback also failed', fallbackError?.message || fallbackError);
        const message = String(primaryError?.message || fallbackError?.message || 'Failed to pay seller');
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Error paying seller:', error);
    return NextResponse.json({ error: String(error?.message || error || 'Failed to pay seller.') }, { status: 500 });
  }
}



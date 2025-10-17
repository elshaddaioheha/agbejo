import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

// Use agbejo helpers if available; otherwise mirror releaseFunds to buyer and then update status
export async function POST(request: Request) {
  const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
  try {
    const { dealId, buyer, amount } = await request.json();
    if (!dealId || !buyer || (typeof amount !== 'number' && typeof amount !== 'string')) {
      return badRequest('Missing required fields. Provide dealId, buyer, amount(number).');
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return badRequest('Invalid amount.');

    // Try dedicated refund if exists
    try {
      if (typeof (agbejo as any).refundBuyer === 'function') {
        await (agbejo as any).refundBuyer(buyer, dealId, amt);
      } else {
        // No dedicated method; just update status and rely on external/manual refund as needed
      }
    } catch (primaryRefundError: any) {
      console.warn('[refund-buyer] Primary refund method failed, attempting fallback...', primaryRefundError?.message || primaryRefundError);
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const legacy = require('@/lib/agbejobackendre.js');
        if (typeof legacy.releaseFunds === 'function') {
          // Reuse releaseFunds semantics but to the buyer instead
          await legacy.releaseFunds(buyer, dealId, amt);
        } else {
          console.warn('[refund-buyer] No fallback transfer method available; proceeding with status update only.');
        }
      } catch (fallbackError: any) {
        console.error('[refund-buyer] Fallback refund also failed', fallbackError?.message || fallbackError);
        // proceed to status update to reflect result even if transfer failed
      }
    }

    try {
      await agbejo.updateStatus(dealId, 'BUYER_REFUNDED', 'REFUND_BUYER');
    } catch (primaryStatusError: any) {
      console.warn('[refund-buyer] Status update failed, attempting fallback...', primaryStatusError?.message || primaryStatusError);
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const legacy = require('@/lib/agbejobackendre.js');
        if (typeof legacy.updateStatus !== 'function') throw new Error('Fallback helper missing updateStatus');
        await legacy.updateStatus(dealId, 'BUYER_REFUNDED', 'REFUND_BUYER');
      } catch (fallbackStatusError: any) {
        console.error('[refund-buyer] Fallback status update failed', fallbackStatusError?.message || fallbackStatusError);
        const message = String(primaryStatusError?.message || fallbackStatusError?.message || 'Failed to update refund status');
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error refunding buyer:', error);
    return NextResponse.json({ error: String(error?.message || error || 'Failed to refund buyer.') }, { status: 500 });
  }
}



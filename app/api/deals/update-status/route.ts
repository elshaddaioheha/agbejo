import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId, status, type } = await request.json();
    if (!dealId || !status || !type) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    try {
      await agbejo.updateStatus(dealId, status, type);
      return NextResponse.json({ ok: true });
    } catch (primaryError: any) {
      console.warn('[update-status] Primary method failed, attempting fallback...', primaryError?.message || primaryError);
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const legacy = require('@/lib/agbejobackendre.js');
        if (typeof legacy.updateStatus !== 'function') throw new Error('Fallback helper missing updateStatus');
        await legacy.updateStatus(dealId, status, type);
        return NextResponse.json({ ok: true, fallback: true });
      } catch (fallbackError: any) {
        console.error('[update-status] Fallback also failed', fallbackError?.message || fallbackError);
        const message = String(primaryError?.message || fallbackError?.message || 'Failed to update status');
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Failed to update status.' }, { status: 500 });
  }
}



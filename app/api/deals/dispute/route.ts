import { NextResponse } from 'next/server';
import agbejo from '@/lib/agbejo';

export async function POST(request: Request) {
  try {
    const { dealId } = await request.json();
    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId.' }, { status: 400 });
    }
    try {
      await agbejo.updateStatus(dealId, 'DISPUTED', 'DISPUTE');
      return NextResponse.json({ ok: true });
    } catch (primaryError: any) {
      console.warn('[dispute] Primary method failed, attempting fallback...', primaryError?.message || primaryError);
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const legacy = require('@/lib/agbejobackendre.js');
        if (typeof legacy.updateStatus !== 'function') throw new Error('Fallback helper missing updateStatus');
        await legacy.updateStatus(dealId, 'DISPUTED', 'DISPUTE');
        return NextResponse.json({ ok: true, fallback: true });
      } catch (fallbackError: any) {
        console.error('[dispute] Fallback also failed', fallbackError?.message || fallbackError);
        const message = String(primaryError?.message || fallbackError?.message || 'Failed to dispute');
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Error disputing deal:', error);
    return NextResponse.json({ error: 'Failed to dispute deal.' }, { status: 500 });
  }
}



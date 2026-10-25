import crypto from 'crypto';
import { signDestRef } from '@/lib/wepay';
import { applyWepayResult } from '@/lib/orders';

// wePAY posts results here (x-www-form-urlencoded). The reply must contain SUCCEED or ERROR,
// otherwise wePAY keeps retrying.
function reply(text, status = 200) {
  return new Response(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  try {
    const fields = Object.fromEntries(new URLSearchParams(await request.text()));
    const sig = new URL(request.url).searchParams.get('sig') || '';

    if (!fields.dest_ref || !safeEqual(sig, signDestRef(fields.dest_ref))) {
      console.warn('[WEPAY CALLBACK] rejected: bad signature', fields.dest_ref);
      return reply('ERROR|INVALID_SIGNATURE', 403);
    }

    const result = await applyWepayResult(fields);
    if (!result.found) return reply('ERROR|ORDER_NOT_FOUND');

    console.log(`[WEPAY CALLBACK] ${fields.dest_ref} status=${fields.status} -> ${result.order.status}`);
    return reply(`SUCCEED|ORDER_ID=${result.order.id}`);
  } catch (error) {
    console.error('[WEPAY CALLBACK ERROR]:', error);
    return reply('ERROR|INTERNAL', 500);
  }
}

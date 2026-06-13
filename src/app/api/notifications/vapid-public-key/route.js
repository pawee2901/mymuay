import { NextResponse } from 'next/server';
import { vapidKeys } from '@/lib/webpush';

export async function GET() {
  return NextResponse.json({ vapidPublicKey: vapidKeys?.publicKey || '' });
}

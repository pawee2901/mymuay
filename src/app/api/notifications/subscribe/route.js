import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

async function getAuthenticatedUser(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'ข้อมูลลงทะเบียนไม่ถูกต้อง' }, { status: 400 });
    }

    // Save or update subscription
    const savedSub = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: user.userId,
        keys: JSON.stringify(subscription.keys || {})
      },
      create: {
        userId: user.userId,
        endpoint: subscription.endpoint,
        keys: JSON.stringify(subscription.keys || {})
      }
    });

    return NextResponse.json({ success: true, id: savedSub.id });
  } catch (error) {
    console.error('[SUBSCRIBE POST ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

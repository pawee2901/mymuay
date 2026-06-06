import { NextResponse } from 'next/server';
import { prisma } from '@/db';

export async function GET() {
  try {
    const apps = await prisma.otpApp.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, apps });
  } catch (error) {
    console.error('[OTP APPS API ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}

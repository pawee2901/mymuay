import { NextResponse } from 'next/server';
import { prisma } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const providers = await prisma.otpProvider.findMany({
      where: { isActive: true }
    });

    const domainsSet = new Set();
    providers.forEach(p => {
      if (p.domains) {
        p.domains.split(',').forEach(d => {
          const trimmed = d.trim().toLowerCase();
          if (trimmed) {
            domainsSet.add(trimmed);
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      domains: Array.from(domainsSet)
    });
  } catch (err) {
    console.error('[PUBLIC OTP PROVIDERS GET ERROR]:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการโหลดโดเมนผู้ให้บริการ' }, { status: 500 });
  }
}

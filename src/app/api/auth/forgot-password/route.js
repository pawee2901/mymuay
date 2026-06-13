import { NextResponse } from 'next/server';
import { prisma } from '@/db';

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้หรืออีเมล' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบชื่อผู้ใช้หรืออีเมลนี้ในระบบ' }, { status: 400 });
    }

    return NextResponse.json({ success: true, username: user.username });
  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

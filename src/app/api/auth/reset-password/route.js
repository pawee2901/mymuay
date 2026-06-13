import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, newPassword } = await request.json();

    if (!username || !newPassword) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้ในระบบ' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update both hashed and plain password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        plainPassword: newPassword
      }
    });

    return NextResponse.json({ success: true, message: 'รีเซ็ตรหัสผ่านใหม่สำเร็จแล้ว' });
  } catch (error) {
    console.error('[RESET PASSWORD ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกรหัสผ่านใหม่' }, { status: 500 });
  }
}

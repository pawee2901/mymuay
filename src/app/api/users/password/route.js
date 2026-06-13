import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

export async function PUT(request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, newPassword } = body;

    if (!username || !newPassword) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมล / ชื่อผู้ใช้ และรหัสผ่านใหม่' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    // Verify user identity
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!user || user.username !== username.trim()) {
      return NextResponse.json({ error: 'อีเมล / ชื่อผู้ใช้งาน ไม่ถูกต้อง' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        password: hashedPassword,
        plainPassword: newPassword
      }
    });

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    });

  } catch (error) {
    console.error('[PASSWORD CHANGE API ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

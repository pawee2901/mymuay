import { NextResponse } from 'next/server';
import { prisma, sendLineNotification } from '@/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        plainPassword: password,
        role: 'USER', // Default role
      }
    });

    // Send Line Notification to Admin
    const lineMsg = `✨ มีสมาชิกสมัครเข้าใช้งานใหม่!\n\n👤 ชื่อผู้ใช้: ${user.username}\n🆔 รหัสผู้ใช้: ${user.id}\n📅 เวลาสมัคร: ${new Date(user.createdAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} น.`;
    sendLineNotification(lineMsg).catch(err => console.error('Error sending signup LINE notification:', err));

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' }, { status: 500 });
  }
}

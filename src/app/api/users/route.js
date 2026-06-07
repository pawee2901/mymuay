import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

// Helper to verify admin status
async function verifyAdmin(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'ADMIN') return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'ล้มเหลวในการดึงข้อมูลรายชื่อผู้ใช้งาน' }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสผู้ใช้งานและยศที่ต้องการปรับ' }, { status: 400 });
    }

    if (role !== 'USER' && role !== 'ADMIN' && role !== 'AGENT') {
      return NextResponse.json({ error: 'บทบาทไม่ถูกต้อง' }, { status: 400 });
    }

    // Don't allow admin to demote themselves
    if (userId === admin.userId) {
      return NextResponse.json({ error: 'ไม่สามารถปรับยศของตัวเองได้' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, username: true, role: true }
    });

    console.log(`[ROLE ADJUST] แอดมินได้ปรับยศผู้ใช้งาน "${updatedUser.username}" เป็น "${updatedUser.role}"`);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'ล้มเหลวในการปรับยศผู้ใช้งาน' }, { status: 500 });
  }
}

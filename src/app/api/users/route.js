import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
        balance: true,
        plainPassword: true,
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

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, password, role, balance } = body;

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    if (username.trim().length < 3) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        plainPassword: password,
        role: role || 'USER',
        balance: parseFloat(balance || 0.0)
      }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('[USER ADD API ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน' }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, username, role, balance, password } = body;

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสผู้ใช้งานที่ต้องการแก้ไข' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' }, { status: 404 });
    }

    // Build update data
    const updateData = {};
    if (username && username.trim()) {
      updateData.username = username.trim();
    }
    if (role) {
      if (role !== 'USER' && role !== 'ADMIN' && role !== 'AGENT') {
        return NextResponse.json({ error: 'บทบาทไม่ถูกต้อง' }, { status: 400 });
      }
      
      // Don't allow admin to demote themselves
      if (userId === admin.userId && role !== 'ADMIN') {
        return NextResponse.json({ error: 'ไม่สามารถเปลี่ยนยศตัวเองได้' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (balance !== undefined) {
      updateData.balance = parseFloat(balance);
    }
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
      updateData.plainPassword = password;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        balance: true,
        plainPassword: true
      }
    });

    console.log(`[USER UPDATE] แอดมินได้แก้ไขผู้ใช้งาน "${updatedUser.username}"`);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('[USER UPDATE API ERROR]:', error);
    return NextResponse.json({ error: 'ล้มเหลวในการแก้ไขผู้ใช้งาน' }, { status: 500 });
  }
}

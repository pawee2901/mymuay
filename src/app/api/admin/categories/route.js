import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

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

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, image } = body;

    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อหมวดหมู่' }, { status: 400 });
    }

    // Check unique category
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'หมวดหมู่นี้มีอยู่ในระบบแล้ว' }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        image: image || 'https://img.rdcw.co.th/images/be45613bbc4077dcc0cabe4080138e8be1a039648f2fba705b61fbb9848b8259.png',
      }
    });

    console.log(`[ADMIN CREATED CATEGORY] แอดมินได้เพิ่มหมวดหมู่ใหม่: "${newCategory.name}"`);

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่ใหม่' }, { status: 500 });
  }
}

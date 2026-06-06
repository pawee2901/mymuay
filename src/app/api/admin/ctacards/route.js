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

export async function GET(request) {
  try {
    const cards = await prisma.ctaCard.findMany({
      orderBy: { id: 'asc' }
    });
    return NextResponse.json({ success: true, cards });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'ล้มเหลวในการดึงข้อมูลกล่องแนะนำ' }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, title, description, imageUrl, linkUrl } = body;

    if (!id || !title || !description || !imageUrl || !linkUrl) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const updatedCard = await prisma.ctaCard.update({
      where: { id },
      data: {
        title,
        description,
        imageUrl,
        linkUrl
      }
    });

    console.log(`[CTA CARD UPDATE] แอดมินได้แก้ไขข้อมูลกล่องแนะนำ "${id}" เป็น: "${title}"`);

    return NextResponse.json({ success: true, card: updatedCard });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขกล่องแนะนำ' }, { status: 500 });
  }
}

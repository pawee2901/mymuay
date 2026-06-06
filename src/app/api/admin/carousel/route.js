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
    const slides = await prisma.carouselSlide.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ success: true, slides });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'ล้มเหลวในการดึงข้อมูลสไลด์โปรโมต' }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, title, description, badge, bgGradient, btnText, image, slideType, linkUrl } = body;

    if (!id || !image) {
      return NextResponse.json({ error: 'กรุณาระบุไอดีสไลด์และใส่รูปภาพหรือวิดีโอ' }, { status: 400 });
    }

    const updatedSlide = await prisma.carouselSlide.update({
      where: { id },
      data: {
        title: title || '',
        description: description || '',
        badge: badge || '',
        bgGradient: bgGradient || 'from-slate-900 to-indigo-950',
        btnText: btnText || '',
        image,
        slideType: slideType || 'STANDARD',
        linkUrl: linkUrl || ''
      }
    });

    console.log(`[CAROUSEL SLIDE UPDATE] แอดมินได้แก้ไขข้อมูลสไลด์โปรโมต "${id}" (ประเภท: ${slideType})`);

    return NextResponse.json({ success: true, slide: updatedSlide });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขสไลด์โปรโมต' }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const newSlide = await prisma.carouselSlide.create({
      data: {
        title: '',
        description: '',
        badge: '',
        image: 'https://placehold.co/800x300?text=Upload+Image',
        slideType: 'FULL_MEDIA',
        linkUrl: ''
      }
    });

    console.log(`[CAROUSEL SLIDE CREATE] แอดมินได้เพิ่มสไลด์โปรโมตใหม่ "${newSlide.id}"`);
    return NextResponse.json({ success: true, slide: newSlide });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเพิ่มสไลด์โปรโมต' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'กรุณาระบุไอดีของสไลด์' }, { status: 400 });
    }

    await prisma.carouselSlide.delete({
      where: { id }
    });

    console.log(`[CAROUSEL SLIDE DELETE] แอดมินได้ลบสไลด์โปรโมต "${id}"`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบสไลด์โปรโมต' }, { status: 500 });
  }
}


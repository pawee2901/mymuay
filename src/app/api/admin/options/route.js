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
    const { productId, name, price, agentPrice, externalPackCode, position } = body;

    if (!productId || !name || price === undefined) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const newOption = await prisma.productOption.create({
      data: {
        productId,
        name,
        price: parseFloat(price),
        agentPrice: parseFloat(agentPrice) || 0.0,
        externalPackCode: (externalPackCode || '').trim(),
        position: parseInt(position) || 0
      }
    });

    console.log(`[ADMIN CREATED OPTION] แอดมินได้เพิ่มตัวเลือกสินค้าใหม่: "${newOption.name}" ราคา ${newOption.price} บาท`);
    return NextResponse.json({ success: true, option: newOption });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างตัวเลือกสินค้า' }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, price, agentPrice, externalPackCode, position } = body;

    if (!id) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสตัวเลือกสินค้า' }, { status: 400 });
    }

    const updatedOption = await prisma.productOption.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        agentPrice: agentPrice !== undefined ? parseFloat(agentPrice) : undefined,
        externalPackCode: externalPackCode !== undefined ? externalPackCode.trim() : undefined,
        position: position !== undefined ? parseInt(position) : undefined,
      }
    });

    console.log(`[ADMIN UPDATED OPTION] แอดมินได้อัปเดตตัวเลือกสินค้า ID: ${id}`);
    return NextResponse.json({ success: true, option: updatedOption });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตตัวเลือกสินค้า' }, { status: 500 });
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
      return NextResponse.json({ error: 'กรุณาระบุรหัสตัวเลือกสินค้า' }, { status: 400 });
    }

    await prisma.productOption.delete({
      where: { id }
    });

    console.log(`[ADMIN DELETED OPTION] แอดมินได้ลบตัวเลือกสินค้า ID: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบตัวเลือกสินค้า' }, { status: 500 });
  }
}

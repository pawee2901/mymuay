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
    const { name, description, price, agentPrice, image, type, categoryId, subCategoryId, gameServiceCode, externalPackCode } = body;

    if (!name || !description || !price || !image || !type || !categoryId) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        agentPrice: parseFloat(agentPrice) || 0.0,
        image,
        type,
        gameServiceCode: type === 'TOPUP' ? (gameServiceCode || '').trim() : '',
        externalPackCode: type === 'TOPUP' ? (externalPackCode || '').trim() : '',
        categoryId,
        subCategoryId: subCategoryId || null,
      }
    });

    console.log(`[ADMIN CREATED PRODUCT] แอดมินได้เพิ่มสินค้าใหม่: "${newProduct.name}" ราคา ${newProduct.price} บาท`);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างสินค้าใหม่' }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, description, price, agentPrice, image, type, categoryId, subCategoryId, gameServiceCode, externalPackCode } = body;

    if (!id || !name || !description || price === undefined || !image || !type || !categoryId) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        agentPrice: parseFloat(agentPrice) || 0.0,
        image,
        type,
        gameServiceCode: type === 'TOPUP' ? (gameServiceCode || '').trim() : '',
        externalPackCode: type === 'TOPUP' ? (externalPackCode || '').trim() : '',
        categoryId,
        subCategoryId: subCategoryId || null,
      }
    });

    console.log(`[ADMIN UPDATED PRODUCT] แอดมินแก้ไขสินค้า ID ${id}: "${updatedProduct.name}" ราคา ${updatedProduct.price} บาท`);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสินค้า' }, { status: 500 });
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
      return NextResponse.json({ error: 'กรุณาระบุรหัสสินค้าที่ต้องการลบ' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id }
    });

    console.log(`[ADMIN DELETED PRODUCT] แอดมินได้ลบสินค้า ID: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบสินค้า' }, { status: 500 });
  }
}

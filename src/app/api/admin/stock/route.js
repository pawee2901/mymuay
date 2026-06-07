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
    const { productId, productOptionId, stockLines } = body;

    if (!productId || !stockLines) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสสินค้าและป้อนรหัสสต๊อก' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ 
      where: { id: productId },
      include: { options: true }
    });
    if (!product) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสินค้านี้ในระบบ' }, { status: 404 });
    }

    // Verify option if provided
    if (productOptionId) {
      const optionExists = product.options.some(opt => opt.id === productOptionId);
      if (!optionExists) {
        return NextResponse.json({ error: 'ไม่พบตัวเลือกสินค้าที่ระบุสำหรับสินค้านี้' }, { status: 404 });
      }
    }

    // Parse lines
    const lines = stockLines
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสสต๊อกอย่างน้อย 1 รายการ' }, { status: 400 });
    }

    // Insert to StockItem table
    const dataToInsert = lines.map(content => ({
      productId,
      productOptionId: productOptionId || null,
      content,
    }));

    const result = await prisma.stockItem.createMany({
      data: dataToInsert,
    });

    console.log(`[STOCK ADDED SUCCESS] แอดมินเติมสต๊อกสินค้า "${product.name}" เพิ่มเติมจำนวน ${result.count} ชิ้นผ่านทางหลังบ้าน`);

    return NextResponse.json({
      success: true,
      addedCount: result.count,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเติมสต๊อกสินค้า' }, { status: 500 });
  }
}

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const productOptionId = searchParams.get('productOptionId');

    if (!productId) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสสินค้า' }, { status: 400 });
    }

    const whereQuery = {
      productId,
      isUsed: false
    };

    if (productOptionId) {
      whereQuery.productOptionId = productOptionId;
    }

    const stockItems = await prisma.stockItem.findMany({
      where: whereQuery,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        productOptionId: true,
        createdAt: true
      }
    });

    return NextResponse.json({ success: true, stockItems });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสต๊อกสินค้า' }, { status: 500 });
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
    const productId = searchParams.get('productId');
    const productOptionId = searchParams.get('productOptionId');

    if (id) {
      // Delete a specific stock item
      await prisma.stockItem.delete({
        where: { id }
      });
      return NextResponse.json({ success: true, message: 'ลบรายการสต๊อกสำเร็จ' });
    }

    if (productId) {
      // Delete all UNUSED stock items for a product
      const deleteWhere = {
        productId,
        isUsed: false
      };
      
      if (productOptionId) {
        deleteWhere.productOptionId = productOptionId;
      }
      
      const result = await prisma.stockItem.deleteMany({
        where: deleteWhere
      });
      return NextResponse.json({ 
        success: true, 
        count: result.count, 
        message: `ลบสต๊อกที่ยังไม่ได้ใช้งานทั้งหมดสำเร็จ (จำนวน ${result.count} รายการ)` 
      });
    }

    return NextResponse.json({ error: 'กรุณาระบุรหัสสต๊อก หรือรหัสสินค้าที่ต้องการลบ' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบรายการสต๊อก' }, { status: 500 });
  }
}

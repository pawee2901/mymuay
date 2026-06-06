import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';

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

export async function POST(request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบเพื่อเช่าเบอร์โทรศัพท์' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { price } = body;

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: 'จำนวนค่าบริการไม่ถูกต้อง' }, { status: 400 });
    }

    // Retrieve user data
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' }, { status: 404 });
    }

    if (user.balance < numericPrice) {
      return NextResponse.json({ error: 'ยอดเงินคงเหลือไม่เพียงพอ กรุณาเติมเงินเข้าระบบก่อนใช้งาน' }, { status: 400 });
    }

    // Deduct balance
    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        balance: {
          decrement: numericPrice
        }
      }
    });

    console.log(`[OTP PURCHASE]: ผู้ใช้ ${updatedUser.username} ได้เช่าเบอร์ หักเงินจำนวน ${numericPrice} บาท ยอดเงินคงเหลือใหม่ ${updatedUser.balance} บาท`);

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance
    });

  } catch (error) {
    console.error('[OTP BUY ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการทำรายการ' }, { status: 500 });
  }
}

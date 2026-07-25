import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

async function verifyAdmin(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'ADMIN' ? decoded : null;
  } catch { return null; }
}

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const requests = await prisma.apiRequest.findMany({
      include: {
        user: {
          select: {
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('[ADMIN GET API REQUESTS ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, action, rejectedReason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const apiReq = await prisma.apiRequest.findUnique({
      where: { id }
    });

    if (!apiReq) {
      return NextResponse.json({ error: 'ไม่พบคำขอใช้งาน API นี้' }, { status: 404 });
    }

    if (action === 'approve') {
      if (apiReq.status === 'approved') {
        return NextResponse.json({ error: 'คำขอนี้ได้รับการอนุมัติไปแล้ว' }, { status: 400 });
      }

      // Update API Request status to approved
      await prisma.apiRequest.update({
        where: { id },
        data: { status: 'approved', rejectedReason: null }
      });

      // Deactivate existing API keys
      await prisma.apiKey.updateMany({
        where: { userId: apiReq.userId, status: 'active' },
        data: { status: 'revoked' }
      });

      // Generate a new secure API Key
      const generatedKey = 'otp_key_live_' + crypto.randomBytes(32).toString('hex');
      
      const newKey = await prisma.apiKey.create({
        data: {
          userId: apiReq.userId,
          apiKey: generatedKey,
          status: 'active'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'อนุมัติการใช้งาน API สำเร็จ ระบบได้สร้าง API Key เรียบร้อยแล้ว',
        apiKey: newKey.apiKey
      });

    } else if (action === 'reject') {
      if (!rejectedReason) {
        return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการไม่อนุมัติ' }, { status: 400 });
      }

      await prisma.apiRequest.update({
        where: { id },
        data: { status: 'rejected', rejectedReason }
      });

      return NextResponse.json({
        success: true,
        message: 'ปฏิเสธคำขอใช้งาน API เรียบร้อยแล้ว'
      });

    } else if (action === 'revoke') {
      // Revoke the user's active API keys
      await prisma.apiKey.updateMany({
        where: { userId: apiReq.userId, status: 'active' },
        data: { status: 'revoked' }
      });

      // Update request status to rejected/revoked
      await prisma.apiRequest.update({
        where: { id },
        data: { status: 'rejected', rejectedReason: 'สิทธิ์ใช้งานถูกยกเลิกโดยผู้ดูแลระบบ' }
      });

      return NextResponse.json({
        success: true,
        message: 'ยกเลิกสิทธิ์ใช้งาน API เรียบร้อยแล้ว'
      });

    } else {
      return NextResponse.json({ error: 'คำสั่งไม่ถูกต้อง' }, { status: 400 });
    }

  } catch (error) {
    console.error('[ADMIN POST API REQUEST ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

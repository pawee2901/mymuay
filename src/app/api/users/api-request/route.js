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

export async function GET(request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiRequest = await prisma.apiRequest.findFirst({
      where: { userId: authUser.userId },
      orderBy: { createdAt: 'desc' }
    });

    const apiKey = await prisma.apiKey.findFirst({
      where: { userId: authUser.userId, status: 'active' },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      has_request: !!apiRequest,
      data: apiRequest || null,
      api_key: apiKey || null
    });
  } catch (error) {
    console.error('[API REQUEST GET ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      purpose,
      services,
      websiteUrl,
      mymuayUsername,
      serverIps,
      contactInfo,
      idCardPath,
      companyCertPath
    } = body;

    // Validate fields
    if (!purpose || !services || !websiteUrl || !mymuayUsername || !serverIps || !contactInfo || !idCardPath) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลขอใช้งาน API ให้ครบถ้วน' }, { status: 400 });
    }

    // Check user's current request status
    const currentRequest = await prisma.apiRequest.findFirst({
      where: { userId: authUser.userId },
      orderBy: { createdAt: 'desc' }
    });

    if (currentRequest) {
      if (currentRequest.status === 'pending') {
        return NextResponse.json({ error: 'คุณมีคำขอที่อยู่ระหว่างดำเนินการตรวจสอบอยู่แล้ว' }, { status: 400 });
      } else if (currentRequest.status === 'approved') {
        return NextResponse.json({ error: 'บัญชีของคุณได้รับการอนุมัติใช้งาน API เรียบร้อยแล้ว' }, { status: 400 });
      }
    }

    // Insert request
    const newRequest = await prisma.apiRequest.create({
      data: {
        userId: authUser.userId,
        purpose,
        services,
        websiteUrl,
        mymuayUsername,
        serverIps,
        contactInfo,
        idCardPath,
        companyCertPath: companyCertPath || null,
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'ส่งคำขอใช้งาน API เรียบร้อยแล้ว กรุณารอแอดมินตรวจสอบและอนุมัติ',
      data: newRequest
    }, { status: 201 });

  } catch (error) {
    console.error('[API REQUEST POST ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

async function verifyUser(request) {
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
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' }, { status: 400 });
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพและไฟล์ PDF เท่านั้น' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name;
    const extension = originalName.split('.').pop() || (isImage ? 'png' : 'pdf');
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Already exists
    }

    const filePath = join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    console.log(`[API REQUEST UPLOAD] User ${user.username} uploaded document: /uploads/${uniqueFilename}`);

    return NextResponse.json({
      success: true,
      url: `/uploads/${uniqueFilename}`
    });

  } catch (error) {
    console.error('[API REQUEST UPLOAD ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' }, { status: 500 });
  }
}

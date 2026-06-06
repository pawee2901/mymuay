import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' }, { status: 400 });
    }

    // Validate is image or video
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพและไฟล์วิดีโอเท่านั้น' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const originalName = file.name;
    const extension = originalName.split('.').pop() || 'png';
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
    
    // Ensure public/uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Already exists
    }

    const filePath = join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    console.log(`[UPLOAD SUCCESS] แอดมินอัปโหลดไฟล์สำเร็จ: /uploads/${uniqueFilename}`);

    return NextResponse.json({
      success: true,
      url: `/uploads/${uniqueFilename}`
    });

  } catch (error) {
    console.error('[IMAGE UPLOAD ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

// GET: list all OTP apps
export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const apps = await prisma.otpApp.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ success: true, apps });
  } catch (err) {
    console.error('[OTP APPS GET ERROR]:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.message }, { status: 500 });
  }
}

// POST: create or update an OTP app
export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, name, senderEmails, regexPattern, logoUrl, isActive } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อแอปพลิเคชัน' }, { status: 400 });
    }

    if (id) {
      // Update existing
      const app = await prisma.otpApp.update({
        where: { id },
        data: {
          name: name.trim(),
          senderEmails: (senderEmails || '').trim(),
          regexPattern: regexPattern ? regexPattern.trim() : null,
          logoUrl: logoUrl ? logoUrl.trim() : null,
          isActive: isActive !== false,
        }
      });
      return NextResponse.json({ success: true, app });
    } else {
      // Create new
      // Generate ID from name if not provided (lowercase, spaces replaced by hyphens)
      const generatedId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Check if ID already exists
      const existingId = await prisma.otpApp.findUnique({ where: { id: generatedId } });
      const finalId = existingId ? `${generatedId}-${Date.now().toString().slice(-4)}` : generatedId;

      const app = await prisma.otpApp.create({
        data: {
          id: finalId,
          name: name.trim(),
          senderEmails: (senderEmails || '').trim(),
          regexPattern: regexPattern ? regexPattern.trim() : null,
          logoUrl: logoUrl ? logoUrl.trim() : null,
          isActive: isActive !== false,
        }
      });
      return NextResponse.json({ success: true, app });
    }
  } catch (err) {
    console.error('[OTP APPS POST ERROR]:', err);
    return NextResponse.json({ error: 'บันทึกไม่สำเร็จ: ' + err.message }, { status: 500 });
  }
}

// DELETE: remove OTP app by ID
export async function DELETE(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.otpApp.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[OTP APPS DELETE ERROR]:', err);
    return NextResponse.json({ error: 'ลบไม่สำเร็จ: ' + err.message }, { status: 500 });
  }
}

// PATCH: toggle isActive
export async function PATCH(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, isActive } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const app = await prisma.otpApp.update({
      where: { id },
      data: { isActive }
    });
    return NextResponse.json({ success: true, app });
  } catch (err) {
    console.error('[OTP APPS PATCH ERROR]:', err);
    return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ: ' + err.message }, { status: 500 });
  }
}

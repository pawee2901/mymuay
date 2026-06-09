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

// GET: list all OTP providers
export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const providers = await prisma.otpProvider.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ success: true, providers });
  } catch (err) {
    console.error('[OTP PROVIDERS GET ERROR]:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.message }, { status: 500 });
  }
}

// POST: create or update an OTP provider
export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, name, apiUrl, domains, isActive } = await request.json();
    if (!name || !apiUrl || !domains) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, API URL, โดเมน)' }, { status: 400 });
    }

    const trimmedDomains = domains.split(',').map(d => d.trim()).filter(Boolean).join(',');

    if (id) {
      // Update existing
      const provider = await prisma.otpProvider.update({
        where: { id },
        data: {
          name: name.trim(),
          apiUrl: apiUrl.trim(),
          domains: trimmedDomains,
          isActive: isActive !== false,
        }
      });
      return NextResponse.json({ success: true, provider });
    } else {
      // Create new
      const provider = await prisma.otpProvider.create({
        data: {
          name: name.trim(),
          apiUrl: apiUrl.trim(),
          domains: trimmedDomains,
          isActive: isActive !== false,
        }
      });
      return NextResponse.json({ success: true, provider });
    }
  } catch (err) {
    console.error('[OTP PROVIDERS POST ERROR]:', err);
    return NextResponse.json({ error: 'บันทึกไม่สำเร็จ: ' + err.message }, { status: 500 });
  }
}

// DELETE: remove OTP provider by ID
export async function DELETE(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.otpProvider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[OTP PROVIDERS DELETE ERROR]:', err);
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

    const provider = await prisma.otpProvider.update({
      where: { id },
      data: { isActive }
    });
    return NextResponse.json({ success: true, provider });
  } catch (err) {
    console.error('[OTP PROVIDERS PATCH ERROR]:', err);
    return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ: ' + err.message }, { status: 500 });
  }
}

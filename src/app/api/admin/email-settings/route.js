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

// GET: list all saved IMAP settings
export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.emailImapSetting.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, domain: true, host: true, port: true,
      tls: true, user: true, appId: true, isActive: true, createdAt: true,
      // DO NOT return password
    }
  });
  return NextResponse.json({ success: true, settings });
}

// POST: create new IMAP setting
export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { domain, host, port, tls, user, password, appId } = await request.json();
    if (!domain || !host || !user || !password) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    // Upsert: update if domain already exists
    const setting = await prisma.emailImapSetting.upsert({
      where: { domain: domain.toLowerCase().trim() },
      create: {
        domain: domain.toLowerCase().trim(),
        host: host.trim(),
        port: parseInt(port) || 993,
        tls: tls !== false,
        user: user.trim(),
        password: password.trim(),
        appId: appId || null,
        isActive: true,
      },
      update: {
        host: host.trim(),
        port: parseInt(port) || 993,
        tls: tls !== false,
        user: user.trim(),
        password: password.trim(),
        appId: appId || null,
        isActive: true,
      },
    });
    return NextResponse.json({ success: true, id: setting.id });
  } catch (err) {
    console.error('[EMAIL SETTINGS POST]:', err);
    return NextResponse.json({ error: 'บันทึกไม่สำเร็จ: ' + err.message }, { status: 500 });
  }
}

// DELETE: remove setting by id
export async function DELETE(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await prisma.emailImapSetting.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH: toggle isActive
export async function PATCH(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, isActive } = await request.json();
  await prisma.emailImapSetting.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ success: true });
}

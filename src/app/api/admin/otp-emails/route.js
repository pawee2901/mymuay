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

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });

  try {
    const emails = await prisma.emailImapSetting.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ emails });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });

  try {
    const body = await request.json();
    const { domain, password, appId } = body;

    if (!domain || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const emailStr = domain.toLowerCase().trim();
    
    // Auto-detect host or use custom host from body
    let host = body.host ? body.host.trim() : null;
    if (!host) {
      host = 'imap-mail.outlook.com'; // Default to hotmail
      if (emailStr.includes('@gmail.com')) {
        host = 'imap.gmail.com';
      } else if (emailStr.includes('@yahoo.com')) {
        host = 'imap.mail.yahoo.com';
      }
    }

    const port = body.port ? parseInt(body.port, 10) : 993;
    const tls = body.tls !== undefined ? Boolean(body.tls) : true;

    const existing = await prisma.emailImapSetting.findUnique({ where: { domain: emailStr } });
    if (existing) {
      // Update existing
      const updated = await prisma.emailImapSetting.update({
        where: { domain: emailStr },
        data: {
          password,
          appId: appId || null,
          host,
          port,
          tls,
          user: emailStr
        }
      });
      return NextResponse.json({ success: true, email: updated });
    }

    // Create new
    const newEmail = await prisma.emailImapSetting.create({
      data: {
        domain: emailStr,
        user: emailStr,
        password,
        appId: appId || null,
        host,
        port,
        tls,
        isActive: true
      }
    });

    return NextResponse.json({ success: true, email: newEmail });
  } catch (error) {
    console.error('[OTP EMAIL SAVE ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error.message || String(error)) }, { status: 500 });
  }
}

export async function DELETE(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ไม่ได้ระบุ ID' }, { status: 400 });

    await prisma.emailImapSetting.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' }, { status: 500 });
  }
}

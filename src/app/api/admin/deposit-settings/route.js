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
  try {
    let setting = await prisma.depositSetting.findUnique({
      where: { id: 'default' }
    });

    if (!setting) {
      setting = await prisma.depositSetting.create({
        data: {
          id: 'default',
          bankName: 'ธนาคารกสิกรไทย (KASIKORNBANK)',
          accountNumber: '112-8-94819-3',
          accountName: 'บริษัท มวยสโตร์ จำกัด (mymuayy Store Co., Ltd.)',
          qrImageUrl: '',
          lineNotifyToken: '',
          lineChannelAccessToken: '',
          lineAdminUserId: ''
        }
      });
    }

    const response = NextResponse.json({ success: true, setting });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('[DEPOSIT SETTING GET ERROR]:', error);
    return NextResponse.json({ error: 'ล้มเหลวในการดึงข้อมูลการตั้งค่าเติมเงิน' }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      bankName, 
      accountNumber, 
      accountName, 
      qrImageUrl, 
      bankLogoUrl, 
      lineNotifyToken, 
      lineChannelAccessToken, 
      lineAdminUserId,
      slipOkApiKey,
      slipOkBranchId
    } = body;

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลธนาคารและบัญชีผู้รับเงินให้ครบถ้วน' }, { status: 400 });
    }

    const cleanLineChannelAccessToken = (lineChannelAccessToken || '').trim().replace(/^['"‘“’“”]|['"’’””]$/g, '');
    const cleanLineAdminUserId = (lineAdminUserId || '').trim().replace(/^['"‘“’“”]|['"’’””]$/g, '');
    const cleanSlipOkApiKey = (slipOkApiKey || '').trim().replace(/^['"‘“’“”]|['"’’””]$/g, '');
    const cleanSlipOkBranchId = (slipOkBranchId || '').trim().replace('#', '').replace(/^['"‘“’“”]|['"’’””]$/g, '');

    const updatedSetting = await prisma.depositSetting.upsert({
      where: { id: 'default' },
      update: {
        bankName,
        accountNumber,
        accountName,
        qrImageUrl: qrImageUrl || '',
        bankLogoUrl: bankLogoUrl || '',
        lineNotifyToken: lineNotifyToken || '',
        lineChannelAccessToken: cleanLineChannelAccessToken,
        lineAdminUserId: cleanLineAdminUserId,
        slipOkApiKey: cleanSlipOkApiKey,
        slipOkBranchId: cleanSlipOkBranchId
      },
      create: {
        id: 'default',
        bankName,
        accountNumber,
        accountName,
        qrImageUrl: qrImageUrl || '',
        bankLogoUrl: bankLogoUrl || '',
        lineNotifyToken: lineNotifyToken || '',
        lineChannelAccessToken: cleanLineChannelAccessToken,
        lineAdminUserId: cleanLineAdminUserId,
        slipOkApiKey: cleanSlipOkApiKey,
        slipOkBranchId: cleanSlipOkBranchId
      }
    });

    console.log(`[DEPOSIT SETTINGS UPDATE] แอดมินได้แก้ไขข้อมูลบัญชีเป็น: ${bankName} - ${accountNumber} และอัปเดต LINE Bot Settings`);

    return NextResponse.json({ success: true, setting: updatedSetting });

  } catch (error) {
    console.error('[DEPOSIT SETTING PUT ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลตั้งค่าเติมเงิน' }, { status: 500 });
  }
}

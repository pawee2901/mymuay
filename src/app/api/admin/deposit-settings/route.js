import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';
import { isValidPromptpayId, normalizePromptpayId } from '@/lib/promptpay';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

const PUBLIC_FIELDS = ['bankName', 'accountNumber', 'accountName', 'qrImageUrl', 'bankLogoUrl', 'promptpayId'];
const EDITABLE_FIELDS = [
  ...PUBLIC_FIELDS,
  'lineNotifyToken',
  'lineChannelAccessToken',
  'lineAdminUserId',
  'slipOkApiKey',
  'slipOkBranchId',
  'wepayUsername',
  'wepayPassword',
];

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

const cleanValue = (value) => String(value ?? '').trim().replace(/^['"‘“’“”]|['"’’””]$/g, '');

async function getOrCreateSetting() {
  return (
    (await prisma.depositSetting.findUnique({ where: { id: 'default' } })) ||
    prisma.depositSetting.create({
      data: { id: 'default', bankName: '', accountNumber: '', accountName: '', qrImageUrl: '' },
    })
  );
}

export async function GET(request) {
  try {
    const setting = await getOrCreateSetting();
    const admin = await verifyAdmin(request);

    // Secrets (SlipOk key, LINE tokens, wePAY password) are only returned to admins
    const visible = admin
      ? { ...setting, wepayPassword: setting.wepayPassword ? '********' : '' }
      : Object.fromEntries(PUBLIC_FIELDS.map((key) => [key, setting[key]]));

    const response = NextResponse.json({ success: true, setting: visible });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error) {
    console.error('[DEPOSIT SETTING GET ERROR]:', error);
    return NextResponse.json({ error: 'ล้มเหลวในการดึงข้อมูลการตั้งค่าเติมเงิน' }, { status: 500 });
  }
}

// Partial update: only fields present in the body are changed
export async function PUT(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = {};
    for (const key of EDITABLE_FIELDS) {
      if (body[key] !== undefined) data[key] = cleanValue(body[key]);
    }

    if (data.slipOkBranchId !== undefined) data.slipOkBranchId = data.slipOkBranchId.replace('#', '');
    if (data.wepayPassword === '********') delete data.wepayPassword; // unchanged placeholder
    if (data.promptpayId) {
      if (!isValidPromptpayId(data.promptpayId)) {
        return NextResponse.json({ error: 'พร้อมเพย์ต้องเป็นเบอร์มือถือ 10 หลัก, เลขบัตรประชาชน 13 หลัก หรือ e-Wallet 15 หลัก' }, { status: 400 });
      }
      data.promptpayId = normalizePromptpayId(data.promptpayId);
    }

    await getOrCreateSetting();
    const updated = await prisma.depositSetting.update({ where: { id: 'default' }, data });

    console.log(`[DEPOSIT SETTINGS UPDATE] fields: ${Object.keys(data).join(', ')}`);
    return NextResponse.json({ success: true, setting: { ...updated, wepayPassword: updated.wepayPassword ? '********' : '' } });
  } catch (error) {
    console.error('[DEPOSIT SETTING PUT ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลตั้งค่าเติมเงิน' }, { status: 500 });
  }
}

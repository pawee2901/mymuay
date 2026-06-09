import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { checkGameTopupStatus, getWonddBalance, getWonddPackList } from '@/lib/wondd';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

async function verifyAdmin(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'ADMIN' ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'balance';

  try {
    if (action === 'packlist') {
      const game = searchParams.get('game') || '';
      const packs = await getWonddPackList(game);
      return NextResponse.json({ success: true, packs });
    }

    const balance = await getWonddBalance();
    return NextResponse.json({ success: true, balance });
  } catch (error) {
    console.error('WonDD admin API error:', error);
    return NextResponse.json({ error: error.message || 'เชื่อมต่อ WonDD ไม่สำเร็จ' }, { status: 502 });
  }
}

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 403 });
  }

  try {
    const { orderId } = await request.json();
    const status = await checkGameTopupStatus(orderId);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('WonDD status check error:', error);
    return NextResponse.json({ error: error.message || 'เช็กสถานะ WonDD ไม่สำเร็จ' }, { status: 502 });
  }
}

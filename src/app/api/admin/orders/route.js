import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/db';
import { syncPendingOrder, failAndRefund } from '@/lib/orders';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

function verifyAdmin(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'ADMIN' ? decoded : null;
  } catch {
    return null;
  }
}

// POST { action: 'sync' | 'sync-all' | 'refund' | 'complete', orderId?, content? }
export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 403 });

  try {
    const { action, orderId, content } = await request.json();

    if (action === 'sync-all') {
      const pending = await prisma.order.findMany({ where: { status: 'PENDING', externalOrderId: { not: null } }, take: 30 });
      let updated = 0;
      for (const order of pending) {
        const result = await syncPendingOrder(order).catch(() => order);
        if (result.status !== 'PENDING') updated++;
      }
      return NextResponse.json({ success: true, checked: pending.length, updated });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId || '' } });
    if (!order) return NextResponse.json({ error: 'ไม่พบออเดอร์' }, { status: 404 });

    if (action === 'sync') {
      if (!order.externalOrderId) return NextResponse.json({ error: 'ออเดอร์นี้ยังไม่มีเลขรายการ wePAY' }, { status: 400 });
      const result = await syncPendingOrder(order);
      return NextResponse.json({ success: true, status: result.status });
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'ทำได้เฉพาะออเดอร์ที่ยังรอดำเนินการ' }, { status: 400 });
    }

    if (action === 'refund') {
      await failAndRefund(order.id, `แอดมิน (${admin.username}) ยกเลิกรายการ`, { externalStatus: 'cancelled_by_admin' });
      return NextResponse.json({ success: true });
    }

    if (action === 'complete') {
      await prisma.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'COMPLETED', content: content?.trim() || 'ดำเนินการสำเร็จโดยแอดมิน', externalStatus: 'completed_by_admin' },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ไม่รู้จักคำสั่งนี้' }, { status: 400 });
  } catch (error) {
    console.error('[ADMIN ORDERS ERROR]:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

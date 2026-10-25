import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/db';
import { getPublicBaseUrl } from '@/lib/wepay';
import { placeOrders, syncPendingOrder, CheckoutError } from '@/lib/orders';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

function getUser(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function serializeOrder(order) {
  return {
    id: order.id,
    status: order.status,
    content: order.content,
    targetId: order.targetId,
    totalPrice: order.totalPrice,
    productName: order.product?.name,
    optionName: order.productOption?.name,
    guideImage: order.stockItem?.guideImage || null,
    createdAt: order.createdAt,
  };
}

// POST { items: [{ productId, productOptionId, targetId, quantity }] }
// Single-item body { productId, ... } is still accepted for older callers.
export async function POST(request) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อสินค้า' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [body];

    const result = await placeOrders({
      userId: user.userId,
      items,
      baseUrl: getPublicBaseUrl(request),
    });

    const orders = await prisma.order.findMany({
      where: { id: { in: result.orders.map((o) => o.id) } },
      include: { product: true, productOption: true, stockItem: { select: { guideImage: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const serialized = orders.map(serializeOrder);

    return NextResponse.json({
      success: true,
      orders: serialized,
      order: serialized[0], // backward compatibility (ProductView)
      total: result.total,
      balance: result.balance,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message, ...error.extra }, { status: error.status });
    }
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบในการสร้างออเดอร์' }, { status: 500 });
  }
}

// GET ?ids=a,b,c — poll status of the user's own orders; pending wePAY orders are re-checked
export async function GET(request) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  const ids = (new URL(request.url).searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 50);
  if (ids.length === 0) return NextResponse.json({ success: true, orders: [] });

  const include = { product: true, productOption: true, stockItem: { select: { guideImage: true } } };
  let orders = await prisma.order.findMany({ where: { id: { in: ids }, userId: user.userId }, include });

  const staleCutoff = Date.now() - 20 * 1000;
  const toSync = orders.filter((o) => o.status === 'PENDING' && o.externalOrderId && new Date(o.createdAt).getTime() < staleCutoff);
  if (toSync.length > 0) {
    for (const order of toSync) {
      await syncPendingOrder(order).catch((err) => console.error('wePAY sync error:', err.message));
    }
    orders = await prisma.order.findMany({ where: { id: { in: ids }, userId: user.userId }, include });
  }

  return NextResponse.json({ success: true, orders: orders.map(serializeOrder) });
}

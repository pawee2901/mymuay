import { prisma, sendLineNotification } from '@/db';
import {
  createWepayPayment,
  getWepayOutput,
  generateDestRef,
  buildCallbackUrl,
} from '@/lib/wepay';
import { validateRef } from '@/lib/wepayRefs';

export class CheckoutError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const isWepayProduct = (product) => Boolean(product.wepayType && product.wepayCompany);

function unitPrice(product, option, isAgent) {
  if (option) return isAgent && option.agentPrice > 0 ? option.agentPrice : option.price;
  return isAgent && product.agentPrice > 0 ? product.agentPrice : product.price;
}

// Validate cart lines and compute prices from the database (never trust client prices)
async function resolveLines(items, isAgent) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new CheckoutError('ตะกร้าสินค้าว่างเปล่า');
  }
  if (items.length > 30) {
    throw new CheckoutError('สั่งซื้อได้สูงสุด 30 รายการต่อครั้ง');
  }

  const lines = [];
  for (const item of items) {
    const quantity = Math.max(1, Math.min(50, parseInt(item.quantity, 10) || 1));
    const product = await prisma.product.findUnique({
      where: { id: item.productId || '' },
      include: { options: true },
    });
    if (!product || !product.isActive) {
      throw new CheckoutError('มีสินค้าบางรายการไม่พร้อมขายแล้ว กรุณาลบออกจากตะกร้า', 404);
    }

    let option = null;
    if (product.options.length > 0) {
      option = product.options.find((opt) => opt.id === item.productOptionId);
      if (!option) throw new CheckoutError(`กรุณาเลือกแพ็กเกจของ "${product.name}" ใหม่อีกครั้ง`, 404);
    }

    const label = `${product.name}${option ? ` (${option.name})` : ''}`;
    const targetId = (item.targetId || '').trim();

    if (product.type === 'TOPUP') {
      if (!targetId) throw new CheckoutError(`กรุณากรอก ID ผู้เล่น สำหรับ "${label}"`);
      if (isWepayProduct(product) && !validateRef(targetId, product.wepayRefFormat)) {
        throw new CheckoutError(`รูปแบบ ID ผู้เล่นของ "${product.name}" ไม่ถูกต้อง: ${targetId}`);
      }
    }

    if (product.type !== 'ACCOUNT' && !isWepayProduct(product)) {
      throw new CheckoutError(`"${product.name}" ยังไม่ได้เชื่อมต่อระบบเติมอัตโนมัติ กรุณาติดต่อแอดมิน`);
    }
    if (isWepayProduct(product) && !(option?.wepayAmount > 0)) {
      throw new CheckoutError(`แพ็กเกจของ "${label}" ยังไม่ได้ตั้งค่า กรุณาติดต่อแอดมิน`);
    }

    const price = unitPrice(product, option, isAgent);
    lines.push({ product, option, label, targetId, quantity, price, total: price * quantity });
  }
  return lines;
}

/**
 * Charge the user's balance and create orders for every cart line.
 * - ACCOUNT products are delivered immediately from stock.
 * - wePAY products are created as PENDING and submitted to wePAY; the callback finalizes them.
 */
export async function placeOrders({ userId, items, baseUrl }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new CheckoutError('ไม่พบข้อมูลผู้ใช้งาน', 404);

  const lines = await resolveLines(items, user.role === 'AGENT');
  const grandTotal = Math.round(lines.reduce((sum, line) => sum + line.total, 0) * 100) / 100;

  if (user.balance < grandTotal) {
    throw new CheckoutError('ยอดเงินไม่เพียงพอ', 402, {
      code: 'INSUFFICIENT_BALANCE',
      total: grandTotal,
      balance: user.balance,
      shortfall: Math.ceil((grandTotal - user.balance) * 100) / 100,
    });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const created = await prisma.$transaction(async (tx) => {
    // Conditional decrement prevents double-spending from concurrent checkouts
    const charged = await tx.user.updateMany({
      where: { id: userId, balance: { gte: grandTotal } },
      data: { balance: { decrement: grandTotal } },
    });
    if (charged.count !== 1) {
      throw new CheckoutError('ยอดเงินไม่เพียงพอ', 402, { code: 'INSUFFICIENT_BALANCE', total: grandTotal });
    }

    const orders = [];
    for (const line of lines) {
      const { product, option } = line;

      if (product.type === 'ACCOUNT') {
        const stock = await tx.stockItem.findMany({
          where: { productId: product.id, productOptionId: option?.id || null, isUsed: false },
          take: line.quantity,
          orderBy: { createdAt: 'asc' },
        });
        if (stock.length < line.quantity) {
          throw new CheckoutError(`สินค้า "${line.label}" ในคลังไม่เพียงพอ`);
        }

        const order = await tx.order.create({
          data: {
            userId,
            productId: product.id,
            productOptionId: option?.id || null,
            quantity: line.quantity,
            price: line.price,
            totalPrice: line.total,
            status: 'COMPLETED',
            content: stock.map((item) => item.content).join('\n'),
            expiresAt,
          },
        });

        for (const item of stock) {
          const claimed = await tx.stockItem.updateMany({
            where: { id: item.id, isUsed: false },
            data: { isUsed: true, usedAt: new Date(), orderId: order.id },
          });
          if (claimed.count !== 1) throw new CheckoutError('สินค้าถูกซื้อไปพร้อมกัน กรุณาลองใหม่อีกครั้ง', 409);
        }
        orders.push({ order, line });
        continue;
      }

      // wePAY: one transaction per unit
      for (let i = 0; i < line.quantity; i++) {
        const order = await tx.order.create({
          data: {
            userId,
            productId: product.id,
            productOptionId: option.id,
            targetId: line.targetId || null,
            quantity: 1,
            price: line.price,
            totalPrice: line.price,
            status: 'PENDING',
            content: 'กำลังดำเนินการ...',
            destRef: generateDestRef(),
            externalStatus: 'queued',
          },
        });
        orders.push({ order, line });
      }
    }
    return orders;
  });

  // Submit wePAY orders after the charge is committed
  for (const entry of created) {
    if (entry.order.status === 'PENDING') {
      entry.order = await submitToWepay(entry.order, entry.line, baseUrl);
    }
  }

  const summary = created.map(({ order, line }) => `• ${line.label}${order.targetId ? ` → ${order.targetId}` : ''} = ${order.totalPrice.toLocaleString()} ฿`).join('\n');
  sendLineNotification(
    `🛍️ มีคำสั่งซื้อใหม่!\n• ผู้ใช้: ${user.username}\n${summary}\n• ยอดรวม: ${grandTotal.toLocaleString()} บาท`
  ).catch((err) => console.error('LINE notify error:', err));

  await warnLowStock(lines);

  const updatedUser = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
  return { orders: created.map(({ order }) => order), total: grandTotal, balance: updatedUser.balance };
}

async function submitToWepay(order, line, baseUrl) {
  const { product, option } = line;
  try {
    const result = await createWepayPayment({
      type: product.wepayType,
      company: product.wepayCompany,
      amount: option.wepayAmount,
      ref1: order.targetId,
      destRef: order.destRef,
      respUrl: buildCallbackUrl(baseUrl, order.destRef),
    });

    // The callback may already have finalized the order — only touch it while PENDING
    await prisma.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: {
        externalOrderId: String(result.transaction_id),
        externalStatus: 'processing',
        externalRawResponse: JSON.stringify(result),
      },
    });
  } catch (error) {
    console.error(`[WEPAY SUBMIT FAILED] order ${order.id}:`, error);
    await failAndRefund(order.id, `ทำรายการไม่สำเร็จ: ${error.message}`, { externalStatus: `error:${error.code || 'unknown'}` });
  }
  return prisma.order.findUnique({ where: { id: order.id } });
}

// Atomically move a PENDING order to FAILED and return the money to the user
export async function failAndRefund(orderId, reason, extraData = {}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return false;

    const moved = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'FAILED', content: `${reason}\nระบบคืนเงิน ${order.totalPrice.toLocaleString()} บาท เข้ากระเป๋าแล้ว`, ...extraData },
    });
    if (moved.count !== 1 || !order.userId) return false;

    await tx.user.update({
      where: { id: order.userId },
      data: { balance: { increment: order.totalPrice } },
    });
    return true;
  });
}

/**
 * Apply a wePAY result (callback body or get_output). Idempotent.
 * fields: dest_ref, transaction_id, sms, status, operator_trxnsid, cashcard_ref1, cashcard_ref2
 */
export async function applyWepayResult(fields) {
  const order = await prisma.order.findUnique({
    where: { destRef: fields.dest_ref || '' },
    include: { product: true, productOption: true, user: { select: { username: true } } },
  });
  if (!order) return { found: false };
  if (order.status !== 'PENDING') return { found: true, order };

  if (order.externalOrderId && fields.transaction_id && order.externalOrderId !== String(fields.transaction_id)) {
    throw new Error(`transaction_id mismatch for ${order.destRef}`);
  }

  const label = `${order.product.name}${order.productOption ? ` (${order.productOption.name})` : ''}`;
  const raw = JSON.stringify(fields);

  if (String(fields.status) === '2') {
    const lines = [`${label} สำเร็จ`];
    if (order.targetId) lines.push(`ID: ${order.targetId}`);
    if (fields.cashcard_ref1) lines.push(`Serial / รหัสบัตร: ${fields.cashcard_ref1}`);
    if (fields.cashcard_ref2) lines.push(`PIN / รหัสผ่าน: ${fields.cashcard_ref2}`);
    if (fields.operator_trxnsid && fields.operator_trxnsid !== 'null') lines.push(`เลขอ้างอิง: ${fields.operator_trxnsid}`);
    else if (fields.transaction_id) lines.push(`เลขอ้างอิง: ${fields.transaction_id}`);

    await prisma.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: {
        status: 'COMPLETED',
        content: lines.join('\n'),
        externalOrderId: fields.transaction_id ? String(fields.transaction_id) : order.externalOrderId,
        externalStatus: 'success',
        externalRawResponse: raw,
      },
    });
  } else if (String(fields.status) === '4') {
    const refunded = await failAndRefund(order.id, `เติมไม่สำเร็จ: ${fields.sms || 'ปลายทางปฏิเสธรายการ'}`, {
      externalOrderId: fields.transaction_id ? String(fields.transaction_id) : order.externalOrderId,
      externalStatus: 'failed',
      externalRawResponse: raw,
    });
    if (refunded) {
      sendLineNotification(
        `⚠️ รายการ wePAY ล้มเหลว (คืนเงินอัตโนมัติแล้ว)\n• ผู้ใช้: ${order.user?.username || '-'}\n• ${label}\n• ID: ${order.targetId || '-'}\n• เหตุผล: ${fields.sms || '-'}`
      ).catch(() => {});
    }
  }

  return { found: true, order: await prisma.order.findUnique({ where: { id: order.id } }) };
}

// Ask wePAY for the latest result of a pending order (fallback when callbacks don't arrive)
export async function syncPendingOrder(order) {
  if (order.status !== 'PENDING' || !order.externalOrderId) return order;
  const output = await getWepayOutput(order.externalOrderId);
  if (!output) return order;
  const result = await applyWepayResult({ ...output, dest_ref: output.dest_ref || order.destRef });
  return result.order || order;
}

async function warnLowStock(lines) {
  for (const { product, option, label } of lines) {
    if (product.type !== 'ACCOUNT') continue;
    const remaining = await prisma.stockItem.count({
      where: { productId: product.id, productOptionId: option?.id || null, isUsed: false },
    });
    if (remaining < 3) {
      sendLineNotification(
        remaining === 0 ? `⚠️ ด่วน! สินค้า "${label}" หมดสต๊อกแล้ว!` : `⚠️ สินค้า "${label}" เหลือ ${remaining} ชิ้น`
      ).catch(() => {});
    }
  }
}

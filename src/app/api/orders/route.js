import { NextResponse } from 'next/server';
import { prisma, sendLineNotification } from '@/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อสินค้า' }, { status: 401 });
    }

    let decodedUser;
    try {
      decodedUser = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, productOptionId, targetId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสสินค้า' }, { status: 400 });
    }

    // 1. Fetch Product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockItems: { where: { isUsed: false } },
        options: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้าในระบบ' }, { status: 404 });
    }

    // Check options
    let chosenOption = null;
    if (product.options && product.options.length > 0) {
      if (!productOptionId) {
        return NextResponse.json({ error: 'กรุณาระบุตัวเลือกสินค้า' }, { status: 400 });
      }
      chosenOption = product.options.find(opt => opt.id === productOptionId);
      if (!chosenOption) {
        return NextResponse.json({ error: 'ไม่พบตัวเลือกสินค้าที่ระบุ' }, { status: 404 });
      }
    }

    const pricePerUnit = chosenOption ? chosenOption.price : product.price;
    const totalPrice = pricePerUnit * quantity;

    let orderContent = '';
    let chosenStockItems = [];

    // 2. Handle digital accounts delivery (ACCOUNT)
    if (product.type === 'ACCOUNT') {
      let availableStock = [];
      if (chosenOption) {
        // Find stock items associated with this specific option
        availableStock = await prisma.stockItem.findMany({
          where: { 
            productId: product.id, 
            productOptionId: chosenOption.id, 
            isUsed: false 
          }
        });
      } else {
        // Find stock items associated with no option
        availableStock = await prisma.stockItem.findMany({
          where: { 
            productId: product.id, 
            productOptionId: null, 
            isUsed: false 
          }
        });
      }

      if (availableStock.length < quantity) {
        return NextResponse.json({ error: 'สินค้าในคลังไม่เพียงพอ' }, { status: 400 });
      }

      // Claim the stock items
      chosenStockItems = availableStock.slice(0, quantity);
      orderContent = chosenStockItems.map(item => item.content).join('\n');
    } 
    // 3. Handle Game Top-ups (TOPUP)
    else if (product.type === 'TOPUP') {
      if (!targetId) {
        return NextResponse.json({ error: 'กรุณากรอกข้อมูล UID / OpenID ของผู้เล่น' }, { status: 400 });
      }
      orderContent = `เติมเงิน ${product.name} สำเร็จไปยัง ID/UID: ${targetId} เรียบร้อยแล้ว (ออโต้)`;
    }

    // Set Expiration Date for subscriptions (default: 30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

    // Check user balance first
    const dbUser = await prisma.user.findUnique({
      where: { id: decodedUser.userId }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' }, { status: 404 });
    }

    if (dbUser.balance < totalPrice) {
      return NextResponse.json({ error: 'ยอดเงินในกระเป๋าเงินไม่เพียงพอ กรุณาเติมเงินเข้าระบบก่อนทำรายการ' }, { status: 400 });
    }

    // 4. Create Order, deduct balance & Update stock items in a database transaction
    const order = await prisma.$transaction(async (tx) => {
      // Deduct balance from User
      await tx.user.update({
        where: { id: decodedUser.userId },
        data: {
          balance: {
            decrement: totalPrice
          }
        }
      });

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: decodedUser.userId,
          productId: product.id,
          productOptionId: chosenOption ? chosenOption.id : null,
          targetId: targetId || null,
          quantity: quantity,
          price: pricePerUnit,
          totalPrice: totalPrice,
          status: 'COMPLETED',
          content: orderContent,
          expiresAt: product.type === 'ACCOUNT' ? expiresAt : null,
        }
      });

      // If digital account, flag stock items as used
      if (product.type === 'ACCOUNT' && chosenStockItems.length > 0) {
        for (const item of chosenStockItems) {
          await tx.stockItem.update({
            where: { id: item.id },
            data: {
              isUsed: true,
              usedAt: new Date(),
              orderId: newOrder.id
            }
          });
        }
      }

      return newOrder;
    });

    // 5. Automation Warning Logs (Stock Alert & Payments Notifications)
    // Send LINE Notification / Terminal Alerts
    console.log(`\n================== AUTOMATED ALERTS ==================`);
    console.log(`[PAYMENT SUCCESS] ลูกค้าสั่งซื้อสำเร็จ: ออเดอร์ ${order.id}`);
    console.log(`- สินค้า: ${product.name}${chosenOption ? ` (${chosenOption.name})` : ''}`);
    console.log(`- ยอดรวม: ${order.totalPrice} บาท`);
    if (order.targetId) console.log(`- ส่งไปยัง UID: ${order.targetId}`);
    
    let msg = `🛍️ มีการสั่งซื้อสินค้าใหม่สำเร็จ!\n` +
              `• ออเดอร์: #${order.id}\n` +
              `• ผู้ใช้: ${decodedUser.username}\n` +
              `• สินค้า: ${product.name}${chosenOption ? ` (${chosenOption.name})` : ''}\n` +
              `• จำนวน: ${quantity} ชิ้น\n` +
              `• ยอดรวม: ${order.totalPrice.toLocaleString()} บาท`;
    if (order.targetId) {
      msg += `\n• ข้อมูลจัดส่ง/UID: ${order.targetId}`;
    }
    
    // Check remaining stock for low stock warning
    if (product.type === 'ACCOUNT') {
      let remainingStockCount = 0;
      if (chosenOption) {
        const optionStockCount = await prisma.stockItem.count({
          where: { productId: product.id, productOptionId: chosenOption.id, isUsed: false }
        });
        remainingStockCount = optionStockCount;
      } else {
        const prodStockCount = await prisma.stockItem.count({
          where: { productId: product.id, productOptionId: null, isUsed: false }
        });
        remainingStockCount = prodStockCount;
      }

      const optionNameText = chosenOption ? ` (${chosenOption.name})` : '';
      if (remainingStockCount === 0) {
        console.log(`[STOCK EMPTY ALERT] ⚠️ ด่วน! สินค้า "${product.name}${optionNameText}" หมดสต๊อกแล้ว!`);
        msg += `\n\n⚠️ ด่วน! สินค้า "${product.name}${optionNameText}" หมดสต๊อกแล้ว!`;
      } else if (remainingStockCount < 3) {
        console.log(`[LOW STOCK ALERT] ⚠️ เตือน! สินค้า "${product.name}${optionNameText}" เหลือในคลังเพียง ${remainingStockCount} ชิ้น!`);
        msg += `\n\n⚠️ เตือน! สินค้า "${product.name}${optionNameText}" เหลือน้อยกว่า 3 ชิ้น (คงเหลือ: ${remainingStockCount} ชิ้น)`;
      }
    }
    console.log(`======================================================\n`);

    sendLineNotification(msg).catch(err => console.error('Error sending Line Notification:', err));

    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบในการสร้างออเดอร์' }, { status: 500 });
  }
}

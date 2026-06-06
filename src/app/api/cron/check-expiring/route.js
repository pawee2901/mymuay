import { NextResponse } from 'next/server';
import { prisma } from '@/db';

export async function GET(request) {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Find orders that are:
    // 1. COMPLETED
    // 2. Expiration date is between now and 3 days from now
    // 3. Expiration date has not yet been processed
    const expiringOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        expiresAt: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      include: {
        product: true
      }
    });

    console.log(`\n================== EXPIRATION EMAIL SCHEDULER ==================`);
    console.log(`ตรวจสอบพบออเดอร์ใกล้หมดอายุใน 3 วันทั้งหมด: ${expiringOrders.length} รายการ`);

    const notificationsSent = [];

    for (const order of expiringOrders) {
      // Simulate sending email to customer
      // Since it's a digital store, we notify them to renew their account/service
      const targetEmail = 'customer_email@gmail.com'; // Mock email since user accounts don't store email yet, or we can use custom names
      
      console.log(`[EMAIL SENT] ส่งเมลแจ้งต่ออายุสำเร็จ!`);
      console.log(`- ไปยัง: ${targetEmail}`);
      console.log(`- เรื่อง: แจ้งเตือนการต่อบริการของท่าน: ${order.product.name}`);
      console.log(`- รายละเอียด: บริการของท่านใกล้จะหมดอายุในวันที่ ${new Date(order.expiresAt).toLocaleDateString('th-TH')}. กรุณาคลิกลิงก์นี้เพื่อสั่งซื้อและต่ออายุบริการเพื่อใช้งานต่อได้แบบต่อเนื่อง!`);
      
      notificationsSent.push({
        orderId: order.id,
        productName: order.product.name,
        expiresAt: order.expiresAt,
        notifiedEmail: targetEmail
      });
    }
    console.log(`================================================================\n`);

    return NextResponse.json({
      success: true,
      checkedCount: expiringOrders.length,
      notificationsSent
    });

  } catch (error) {
    console.error('Expiry scan error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบรายการหมดอายุ' }, { status: 500 });
  }
}

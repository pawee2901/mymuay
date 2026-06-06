import { NextResponse } from 'next/server';
import { prisma } from '@/db';

// For simulated security, we record the authorized Admin's LINE User ID
const ADMIN_LINE_USER_ID = 'U1234567890abcdef1234567890abcdef';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[LINE WEBHOOK] Received event:', JSON.stringify(body));

    // Handle LINE Webhook validation event
    if (!body.events || body.events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events found' });
    }

    const event = body.events[0];
    
    // Check if it is a text message
    if (event.type !== 'message' || event.message.type !== 'text') {
      return NextResponse.json({ success: true, message: 'Not a text event' });
    }

    const text = event.message.text.trim();
    const senderLineId = event.source.userId;

    // Verify Admin LINE User ID
    if (senderLineId !== ADMIN_LINE_USER_ID) {
      console.log(`[LINE WEBHOOK SECURITY ALERT] Unauthenticated LINE User ID: ${senderLineId} tried to interact!`);
      return NextResponse.json({ error: 'Unauthorized sender' }, { status: 401 });
    }

    // Command Check: /เติมสต๊อก หรือ /addstock
    if (text.startsWith('/เติมสต๊อก') || text.startsWith('/addstock')) {
      const lines = text.split('\n');
      const commandHeader = lines[0]; // e.g. "/เติมสต๊อก Netflix"
      
      // Parse product search query
      const searchQuery = commandHeader
        .replace('/เติมสต๊อก', '')
        .replace('/addstock', '')
        .trim();

      if (!searchQuery) {
        return NextResponse.json({ reply: 'กรุณาระบุชื่อสินค้า เช่น /เติมสต๊อก Netflix' });
      }

      // Find product matching name
      const product = await prisma.product.findFirst({
        where: {
          name: { contains: searchQuery }
        }
      });

      if (!product) {
        return NextResponse.json({ reply: `ไม่พบสินค้าที่มีชื่อตรงกับ "${searchQuery}"` });
      }

      // Extract keys (from line 1 onwards)
      const keys = lines.slice(1).map(line => line.trim()).filter(line => line.length > 0);

      if (keys.length === 0) {
        return NextResponse.json({ reply: `กรุณากรอกคีย์ที่ต้องการเติมใต้หัวข้อบรรทัดคำสั่ง` });
      }

      // Batch insert keys
      const dataToInsert = keys.map(content => ({
        productId: product.id,
        content
      }));

      const result = await prisma.stockItem.createMany({
        data: dataToInsert
      });

      console.log(`[LINE BOT AUTOMATION] แอดมินเติมสต๊อกสำเร็จผ่าน LINE OA! สินค้า: ${product.name} | เพิ่มจำนวน: ${result.count} ชิ้น`);

      return NextResponse.json({
        success: true,
        reply: `✅ เติมสต๊อกสินค้า "${product.name}" สำเร็จแล้วจำนวน ${result.count} ชิ้น!`,
        result
      });
    }

    return NextResponse.json({ success: true, message: 'Command not recognized' });

  } catch (error) {
    console.error('LINE webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

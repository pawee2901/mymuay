import { NextResponse } from 'next/server';
import { prisma, sendLineNotification } from '@/db';
import jwt from 'jsonwebtoken';
import { sendPush } from '@/lib/webpush';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

async function getAuthenticatedUser(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนใช้งานแชท' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'GROUP'; // 'GROUP' or 'SUPPORT'
  const targetUserId = searchParams.get('userId'); // Used by admin to fetch specific user's ticket

  try {
    if (type === 'GROUP') {
      // Fetch latest 100 group messages
      const messages = await prisma.chatMessage.findMany({
        where: { type: 'GROUP' },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
      return NextResponse.json({ success: true, messages });
    }

    if (type === 'SUPPORT') {
      // Support Chat logic
      if (user.role === 'ADMIN') {
        if (!targetUserId) {
          // Admin needs a list of unique users who have support threads
          const messages = await prisma.chatMessage.findMany({
            where: { type: 'SUPPORT' },
            orderBy: { createdAt: 'desc' },
          });

          // Group by userId, keep the latest message for preview
          const threadsMap = {};
          messages.forEach((msg) => {
            if (msg.userId && !threadsMap[msg.userId]) {
              threadsMap[msg.userId] = {
                userId: msg.userId,
                username: msg.username === 'Admin Support' ? 'ลูกค้า' : msg.username,
                lastMessage: msg.message,
                createdAt: msg.createdAt,
              };
            }
          });

          const threads = Object.values(threadsMap).sort((a, b) => b.createdAt - a.createdAt);
          return NextResponse.json({ success: true, threads });
        } else {
          // Admin fetching messages for a specific user support ticket
          const messages = await prisma.chatMessage.findMany({
            where: { type: 'SUPPORT', userId: targetUserId },
            orderBy: { createdAt: 'asc' },
          });
          return NextResponse.json({ success: true, messages });
        }
      } else {
        // Regular user: only fetch their own support messages
        const messages = await prisma.chatMessage.findMany({
          where: { type: 'SUPPORT', userId: user.userId },
          orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json({ success: true, messages });
      }
    }

    return NextResponse.json({ error: 'ประเภทแชทไม่ถูกต้อง' }, { status: 400 });
  } catch (error) {
    console.error('[CHAT GET ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการโหลดข้อความ' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนใช้งานแชท' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, type, mediaUrl, mediaType } = body;
    const targetUserId = body.userId; // Provided by admin when replying to a user

    if ((!message || !message.trim()) && !mediaUrl) {
      return NextResponse.json({ error: 'กรุณากรอกข้อความหรืออัปโหลดไฟล์' }, { status: 400 });
    }

    if (type === 'GROUP') {
      const newMessage = await prisma.chatMessage.create({
        data: {
          username: user.username,
          userId: user.userId,
          message: (message || '').trim(),
          type: 'GROUP',
          isAdmin: user.role === 'ADMIN',
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
        },
      });

      // Send LINE notification if sender is not admin
      if (user.role !== 'ADMIN') {
        const lineMsg = `💬 [แชทกลุ่มร้านค้า]\n` +
                        `• ผู้ส่ง: ${user.username} (ID: ${user.userId})\n` +
                        `• ข้อความ: ${newMessage.message || '[ส่งสื่อ/รูปภาพ/วิดีโอ]'}` +
                        (mediaUrl ? `\n• แนบไฟล์: ${mediaType} (${mediaUrl})` : '');
        sendLineNotification(lineMsg).catch(err => console.error('Error sending Chat LINE Notification:', err));
      }

      return NextResponse.json({ success: true, message: newMessage });
    }

    if (type === 'SUPPORT') {
      let msgUserId = user.userId;
      let msgUsername = user.username;
      let msgIsAdmin = false;

      if (user.role === 'ADMIN') {
        if (!targetUserId) {
          return NextResponse.json({ error: 'กรุณาระบุไอดีของลูกค้าที่ต้องการตอบกลับ' }, { status: 400 });
        }
        msgUserId = targetUserId;
        msgUsername = 'Admin Support';
        msgIsAdmin = true;
      }

      const newMessage = await prisma.chatMessage.create({
        data: {
          username: msgUsername,
          userId: msgUserId,
          message: (message || '').trim(),
          type: 'SUPPORT',
          isAdmin: msgIsAdmin,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
        },
      });

      // Send Web Push Notification to the recipient(s)
      try {
        let recipientIds = [];
        if (msgIsAdmin) {
          // Admin replies to customer: recipient is the customer
          recipientIds = [msgUserId];
        } else {
          // Customer sends to admin: recipient is all admins
          const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
          });
          recipientIds = admins.map(a => a.id);
        }

        const subscriptions = await prisma.pushSubscription.findMany({
          where: { userId: { in: recipientIds } }
        });

        if (subscriptions.length > 0) {
          const pushPayload = {
            title: msgIsAdmin ? 'ข้อความใหม่จากฝ่ายสนับสนุน (Admin)' : `แชทติดต่อใหม่จากลูกค้า: ${user.username}`,
            body: newMessage.message || 'ส่งรูปภาพหรือไฟล์แนบ',
            icon: '/favicon.ico',
            data: {
              url: '/chat'
            }
          };

          // Trigger push in background
          Promise.all(
            subscriptions.map(sub => 
              sendPush(sub, pushPayload).then(res => {
                if (res.expired) {
                  // Clean up expired subscription
                  return prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                }
              })
            )
          ).catch(err => console.error('[CHAT WEBPUSH ERROR]:', err));
        }
      } catch (pushErr) {
        console.error('[CHAT WEBPUSH TRIGGER ERROR]:', pushErr);
      }

      // Send LINE notification if sender is not admin (i.e. it is the customer opening/replying to a ticket)
      if (!msgIsAdmin) {
        const lineMsg = `💬 [ติดต่อสอบถาม / Support]\n` +
                        `• ลูกค้า: ${user.username} (ID: ${user.userId})\n` +
                        `• ข้อความ: ${newMessage.message || '[ส่งสื่อ/รูปภาพ/วิดีโอ]'}` +
                        (mediaUrl ? `\n• แนบไฟล์: ${mediaType} (${mediaUrl})` : '');
        sendLineNotification(lineMsg).catch(err => console.error('Error sending Support Chat LINE Notification:', err));
      }

      return NextResponse.json({ success: true, message: newMessage });
    }

    return NextResponse.json({ error: 'ประเภทแชทไม่ถูกต้อง' }, { status: 400 });
  } catch (error) {
    console.error('[CHAT POST ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' }, { status: 500 });
  }
}

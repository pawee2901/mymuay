import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';

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
    return NextResponse.json({ success: true, latestMessage: null });
  }

  try {
    if (user.role === 'ADMIN') {
      const latestMessage = await prisma.chatMessage.findFirst({
        where: {
          type: 'SUPPORT',
          isAdmin: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json({
        success: true,
        latestMessage: latestMessage ? {
          id: latestMessage.id,
          username: latestMessage.username,
          message: latestMessage.message,
          createdAt: latestMessage.createdAt
        } : null
      });
    } else {
      const latestMessage = await prisma.chatMessage.findFirst({
        where: {
          type: 'SUPPORT',
          userId: user.userId,
          isAdmin: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json({
        success: true,
        latestMessage: latestMessage ? {
          id: latestMessage.id,
          username: latestMessage.username,
          message: latestMessage.message,
          createdAt: latestMessage.createdAt
        } : null
      });
    }
  } catch (error) {
    console.error('[UNREAD CHECK ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

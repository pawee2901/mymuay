import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch latest user data from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { balance: true, role: true }
    });
    
    if (!dbUser) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.delete('token');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }
    
    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.userId,
        username: decoded.username,
        role: dbUser.role || decoded.role,
        balance: dbUser.balance
      }
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;

  } catch (error) {
    console.error('Session check error:', error);
    // Token is invalid/expired
    const response = NextResponse.json({ authenticated: false }, { status: 401 });
    response.cookies.delete('token'); // Clear corrupted cookie
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
}


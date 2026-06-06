import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

async function verifyAdmin(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'ADMIN') return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let setting = await prisma.siteSetting.findUnique({
      where: { id: 'default' }
    });
    
    if (!setting) {
      setting = await prisma.siteSetting.create({
        data: { id: 'default', storeName: 'mymuayy', logoUrl: '' }
      });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Error fetching admin site settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { storeName, logoUrl } = await request.json();

    const setting = await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: {
        storeName: storeName || 'mymuayy',
        logoUrl: logoUrl || ''
      },
      create: {
        id: 'default',
        storeName: storeName || 'mymuayy',
        logoUrl: logoUrl || ''
      }
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

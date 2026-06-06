import { NextResponse } from 'next/server';
import { prisma } from '@/db';

export async function GET() {
  try {
    let setting = await prisma.siteSetting.findUnique({
      where: { id: 'default' }
    });

    if (!setting) {
      setting = await prisma.siteSetting.create({
        data: {
          id: 'default',
          storeName: 'mymuayy',
          logoUrl: ''
        }
      });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

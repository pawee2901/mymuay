import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'ออกจากระบบเรียบร้อยแล้ว' });
    
    // Clear cookie
    response.cookies.delete('token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการออกจากระบบ' }, { status: 500 });
  }
}

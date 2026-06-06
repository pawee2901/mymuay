import { NextResponse } from 'next/server';
import { prisma, sendLineNotification } from '@/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';

const cleanEnvValue = (val) => {
  if (!val) return '';
  return val.trim().replace(/^['"‘“’“”]|['"’’””]$/g, '');
};

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

export async function POST(request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการเติมเงิน' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const slipFile = formData.get('slip');

    if (!slipFile) {
      return NextResponse.json({ error: 'ไม่พบไฟล์สลิป กรุณาอัปโหลดรูปภาพ' }, { status: 400 });
    }

    // Load SlipOk credentials from database with env fallback
    const setting = await prisma.depositSetting.findUnique({
      where: { id: 'default' }
    });

    const activeApiKey = cleanEnvValue(setting?.slipOkApiKey || process.env.SLIPOK_API_KEY);
    const activeBranchId = cleanEnvValue(setting?.slipOkBranchId || process.env.SLIPOK_BRANCH_ID).replace('#', '');

    console.log('[SLIPOK API CALL] Credentials loaded:', {
      hasKey: !!activeApiKey,
      keyLen: activeApiKey.length,
      branchId: activeBranchId,
      branchIdLen: activeBranchId.length
    });

    let depositAmount = 0;
    let transRef = '';
    let sendingBank = '';
    let senderName = '';
    let transDatetime = '';

    // If activeApiKey is configured, call SlipOk API
    if (activeApiKey && activeBranchId) {
      const slipOkFormData = new FormData();
      slipOkFormData.append('files', slipFile);
      slipOkFormData.append('log', 'true');

      console.log('Sending to SlipOk URL:', `https://api.slipok.com/api/line/apikey/${activeBranchId}`);
      console.log('x-authorization value:', JSON.stringify(activeApiKey));

      const slipOkResponse = await fetch(`https://api.slipok.com/api/line/apikey/${activeBranchId}`, {
        method: 'POST',
        headers: {
          'x-authorization': activeApiKey
        },
        body: slipOkFormData
      });

      const slipOkData = await slipOkResponse.json();

      if (!slipOkResponse.ok || !slipOkData.success) {
        console.error('SlipOk Error:', slipOkData);
        // Map common error codes
        if (slipOkData.code === 1012) return NextResponse.json({ error: 'สลิปนี้ถูกใช้งานไปแล้วในระบบ (รหัส 1012)' }, { status: 400 });
        if (slipOkData.code === 1014) return NextResponse.json({ error: 'บัญชีผู้รับเงินบนสลิปไม่ตรงกับบัญชีร้านค้า' }, { status: 400 });
        return NextResponse.json({ error: slipOkData.message || 'สลิปไม่ถูกต้อง หรือไม่สามารถอ่าน QR Code ได้' }, { status: 400 });
      }

      const { data } = slipOkData;
      depositAmount = data.amount;
      transRef = data.transRef;
      sendingBank = data.sendingBank;
      senderName = data.sender?.name || data.sender?.displayName || '';
      transDatetime = `${data.transDate} ${data.transTime}`;

    } else {
      // Mock Data if API keys are missing (For development purposes only!)
      console.warn('⚠️ SLIPOK_API_KEY is missing! Using Mock Slip Verification.');
      depositAmount = 100; // Mock 100 THB
      transRef = `MOCK-${Date.now()}`;
      sendingBank = 'MOCK_BANK';
      senderName = 'Mock User';
      transDatetime = new Date().toISOString();
    }

    if (depositAmount <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินบนสลิปไม่ถูกต้อง' }, { status: 400 });
    }

    // LAYER 1: Anti-Double Spending (Verify again in our DB just to be safe)
    const existingSlip = await prisma.slipVerification.findUnique({
      where: { transRef }
    });

    if (existingSlip) {
      return NextResponse.json({ error: 'สลิปนี้ถูกอัปโหลดเข้าระบบแล้ว' }, { status: 400 });
    }

    // Update user balance, create SlipVerification and DepositTransaction in a single transaction
    const [updatedUser, newTransaction, newSlipVerification] = await prisma.$transaction([
      prisma.user.update({
        where: { id: authUser.userId },
        data: {
          balance: {
            increment: depositAmount
          }
        }
      }),
      prisma.depositTransaction.create({
        data: {
          userId: authUser.userId,
          amount: depositAmount,
          status: 'COMPLETED'
        }
      }),
      prisma.slipVerification.create({
        data: {
          userId: authUser.userId,
          transRef,
          amount: depositAmount,
          sendingBank,
          senderName,
          transDatetime
        }
      })
    ]);

    console.log(`[DEPOSIT SUCCESS]: ผู้ใช้ ${updatedUser.username} เติมเงินด้วยสลิปยอด ${depositAmount} บาทสำเร็จ ยอดใหม่คือ ${updatedUser.balance} บาท`);

    // ส่งแจ้งเตือน Line Notify แบบ asynchronous
    sendLineNotification(
      `💰 แจ้งเตือนการเติมเงินผ่านสลิปสำเร็จ!\n` +
      `• ผู้ใช้: ${updatedUser.username}\n` +
      `• ชื่อผู้โอน: ${senderName || 'ไม่ระบุ'}\n` +
      `• ธนาคาร: ${sendingBank || 'ไม่ระบุ'}\n` +
      `• รหัสอ้างอิง: ${transRef}\n` +
      `• จำนวน: ${depositAmount.toLocaleString()} บาท\n` +
      `• ยอดคงเหลือใหม่: ${updatedUser.balance.toLocaleString()} บาท`
    ).catch(err => console.error('Error sending Line Notification:', err));

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance,
      message: `ยอดเงินจำนวน ${depositAmount.toLocaleString()} บาท ถูกเพิ่มเข้ากระเป๋าของคุณแล้ว!`
    });

  } catch (error) {
    console.error('[DEPOSIT SLIP API ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป โปรดตรวจสอบภาพสลิปของคุณอีกครั้ง' }, { status: 500 });
  }
}

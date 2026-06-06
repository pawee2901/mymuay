import { prisma } from './index';

export async function sendLineNotification(message) {
  try {
    const setting = await prisma.depositSetting.findUnique({
      where: { id: 'default' }
    });
    
    let token = setting?.lineChannelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
    let adminLineUserId = setting?.lineAdminUserId || process.env.LINE_ADMIN_USER_ID;

    // Clean tokens of quotes or whitespace if present (including smart quotes)
    if (token) {
      token = token.trim().replace(/^['"‘“’“”]|['"’’””]$/g, '');
    }
    if (adminLineUserId) {
      adminLineUserId = adminLineUserId.trim().replace(/^['"‘“’“”]|['"’’””]$/g, '');
    }

    if (!token || !adminLineUserId) {
      console.log('[LINE BOT - SIMULATED ALERT] (Missing token or Admin LINE User ID):\n', message);
      return false;
    }

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: adminLineUserId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    });

    const data = await res.json();
    console.log('[LINE BOT RESPONSE]:', data);
    return res.status === 200 || res.status === 202;
  } catch (error) {
    console.error('[LINE BOT ERROR]:', error);
    return false;
  }
}

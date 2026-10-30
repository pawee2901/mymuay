import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { extractOtpCode, fetchImapMails } from '@/lib/otpMail';

export const dynamic = 'force-dynamic';

function getDomainId(domain) {
  return domain.trim().replace(/\./g, '');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const limitStr = searchParams.get('limit') || '5';
  const limit = Math.min(parseInt(limitStr) || 5, 20);

  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized. X-API-Key header is missing.' }, { status: 401 });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ status: 'error', message: 'Invalid or missing email parameter.' }, { status: 400 });
  }

  try {
    // 1. Validate API Key
    const keyRecord = await prisma.apiKey.findUnique({
      where: { apiKey, status: 'active' }
    });

    if (!keyRecord) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized. Invalid or revoked API Key.' }, { status: 401 });
    }

    // 2. Fetch approved API request for Server IP validation
    const apiRequest = await prisma.apiRequest.findFirst({
      where: { userId: keyRecord.userId, status: 'approved' },
      orderBy: { createdAt: 'desc' }
    });

    if (!apiRequest) {
      return NextResponse.json({ status: 'error', message: 'Forbidden. No approved API request found for this account.' }, { status: 403 });
    }

    // 3. Get client IP
    const clientIp = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     '127.0.0.1';

    // Normalize IPv6
    let cleanClientIp = clientIp;
    if (cleanClientIp === '::1' || cleanClientIp === '::ffff:127.0.0.1') {
      cleanClientIp = '127.0.0.1';
    } else if (cleanClientIp && cleanClientIp.startsWith('::ffff:')) {
      cleanClientIp = cleanClientIp.replace('::ffff:', '');
    }

    const allowedIps = apiRequest.serverIps.split(',').map(ip => ip.trim());
    const isIpAllowed = allowedIps.includes(cleanClientIp) || allowedIps.includes('*') || cleanClientIp === '127.0.0.1';

    if (!isIpAllowed) {
      console.log(`Blocked request from unauthorized IP: ${cleanClientIp}. Whitelisted: ${apiRequest.serverIps}`);
      return NextResponse.json({ 
        status: 'error', 
        message: `Forbidden. IP address ${cleanClientIp} is not whitelisted. Please update your registered IP Server.` 
      }, { status: 403 });
    }

    // 4. Fetch OTP for the target email
    const lowerEmail = email.toLowerCase().trim();
    const [accountName, domain] = lowerEmail.split('@');
    const lowerDomain = domain.toLowerCase().trim();

    // Query active providers from DB to check if it matches a Maily Space domain
    const activeProviders = await prisma.otpProvider.findMany({
      where: { isActive: true }
    });

    let matchedProvider = null;
    for (const prov of activeProviders) {
      const provDomains = (prov.domains || '').split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
      if (provDomains.includes(lowerDomain)) {
        matchedProvider = prov;
        break;
      }
    }

    let allResults = [];

    if (matchedProvider) {
      // -------------------------------------------------------
      // Channel A: Maily Space Provider
      // -------------------------------------------------------
      const domainId = getDomainId(domain);
      const queryParams = new URLSearchParams({
        size: String(limit),
        page: '1',
        accountName,
        domainId
      });

      const res = await fetch(`${matchedProvider.apiUrl}?${queryParams}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const data = await res.json();
        const mails = data?.data?.mails || data?.mails || [];
        for (const mail of mails) {
          const otp = extractOtpCode(mail.html, mail.text);
          allResults.push({
            email: lowerEmail,
            otp: otp || 'ไม่พบตัวเลขรหัส',
            subject: mail.subject || 'ไม่มีหัวข้อ',
            sender: mail.from || '',
            received_at: mail.date || mail.createdAt || new Date().toISOString(),
            body_preview: (mail.text || mail.html || '').replace(/<[^>]*>?/gm, ' ').substring(0, 1500)
          });
        }
      }
    } else {
      // -------------------------------------------------------
      // Channel B: Private IMAP
      // -------------------------------------------------------
      const imapSetting = await prisma.emailImapSetting.findFirst({
        where: {
          OR: [
            { domain: lowerEmail },
            { domain: lowerDomain }
          ],
          isActive: true
        }
      });

      if (imapSetting && imapSetting.isActive) {
        try {
          const mails = await fetchImapMails(imapSetting, { email: lowerEmail, sinceHours: 6, limit });
          for (const mail of mails) {
            const otpCode = extractOtpCode(mail.html, mail.text);
            allResults.push({
              email: lowerEmail,
              otp: otpCode || 'ไม่พบตัวเลขรหัส',
              subject: mail.subject || 'ไม่มีหัวข้อ',
              sender: mail.from || '',
              received_at: mail.date || new Date().toISOString(),
              body_preview: (mail.text || mail.subject || '').substring(0, 1500)
            });
          }
        } catch (imapErr) {
          console.error('[IMAP CONNECT ERROR IN PUBLIC API]:', imapErr);
          return NextResponse.json({ status: 'error', message: 'Failed to fetch emails via IMAP.' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ status: 'error', message: `The email '${email}' is not configured in the system.` }, { status: 404 });
      }
    }

    if (allResults.length === 0) {
      return NextResponse.json({
        status: 'success',
        count: 0,
        message: 'No recent OTP messages found.',
        list: []
      });
    }

    // Sort by received_at descending (newest first)
    allResults.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));
    const latestItem = allResults[0];

    return NextResponse.json({
      status: 'success',
      email: latestItem.email,
      otp: latestItem.otp,
      subject: latestItem.subject,
      sender: latestItem.sender,
      received_at: latestItem.received_at,
      list: allResults.slice(0, limit)
    });

  } catch (error) {
    console.error('[PUBLIC GET OTP API ERROR]:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

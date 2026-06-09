import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export const dynamic = 'force-dynamic';

const MAILY_API_URL = process.env.MAILY_API_URL || "https://api.maily.space/mail/public/mails";

// Convert domain to maily domainId: lico.moe -> licomoe
function getDomainId(domain) {
  return domain.trim().replace(/\./g, '');
}

function matchesApp(from, subject, appId, senderList = []) {
  const lf = (from || '').toLowerCase();
  const ls = (subject || '').toLowerCase();
  const la = (appId || '').toLowerCase();

  // If we have custom sender emails configured in DB, prioritize matching them
  if (senderList && senderList.length > 0) {
    const matched = senderList.some(email => lf.includes(email) || ls.includes(email));
    if (matched) return true;
  }

  if (la.includes('netflix')) {
    return lf.includes('netflix') || ls.includes('netflix');
  } else if (la.includes('disney')) {
    return lf.includes('disney') || ls.includes('disney');
  } else if (la.includes('true') || la.includes('trueid')) {
    return lf.includes('trueid') || ls.includes('trueid') || lf.includes('true') || ls.includes('true');
  } else if (la.includes('chat') || la.includes('openai') || la.includes('gpt')) {
    return lf.includes('openai') || ls.includes('openai') || lf.includes('chatgpt') || ls.includes('chatgpt');
  } else if (la.includes('prime') || la.includes('amazon')) {
    return lf.includes('prime') || ls.includes('prime') || lf.includes('amazon') || ls.includes('amazon');
  } else if (la.includes('spotify')) {
    return lf.includes('spotify') || ls.includes('spotify');
  } else if (la.includes('youtube')) {
    return lf.includes('youtube') || ls.includes('youtube') || lf.includes('google') || ls.includes('google');
  }
  // Fallback: match by appId keyword in from/subject
  return lf.includes(la) || ls.includes(la);
}

function extractOtpCode(html = '', text = '') {
  // Strip style and script tags content completely
  let cleanHtml = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove HTML tags
  cleanHtml = cleanHtml.replace(/<[^>]*>?/gm, ' ');

  // Combine text and cleaned html
  let content = (text || '') + ' ' + cleanHtml;

  // Remove hex color codes (e.g. #121212 or #fff)
  content = content.replace(/#([a-fA-F0-9]{3,8})\b/g, ' ');

  // Try 6-digit first (most common OTP)
  let match = content.match(/\b(\d{6})\b/);
  if (match) return match[1];

  // Try 4-8 digits
  match = content.match(/\b(\d{4,8})\b/);
  if (match) return match[1];

  return null;
}

export async function POST(request) {
  try {
    const { appId, email, mailId } = await request.json();

    if (!appId || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();
    const [accountName, domain] = lowerEmail.split('@');
    const lowerDomain = domain.toLowerCase().trim();

    // Query active providers from DB
    let activeProviders = [];
    try {
      activeProviders = await prisma.otpProvider.findMany({
        where: { isActive: true }
      });
    } catch (dbErr) {
      console.error('[FETCH] Error fetching providers:', dbErr);
    }

    // Check if domain matches any active provider
    let matchedProvider = null;
    for (const prov of activeProviders) {
      const provDomains = (prov.domains || '').split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
      if (provDomains.includes(lowerDomain)) {
        matchedProvider = prov;
        break;
      }
    }

    const isMailyDomain = !!matchedProvider;

    let matchingMails = [];
    let senderList = [];

    try {
      const dbApp = await prisma.otpApp.findUnique({
        where: { id: appId }
      });
      if (dbApp && dbApp.senderEmails) {
        senderList = dbApp.senderEmails.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      }
    } catch (err) {
      console.error('[FETCH] Error loading app config:', err);
    }

    if (isMailyDomain && matchedProvider) {
      // -------------------------------------------------------
      // Channel A: Dynamic OTP API Provider (Maily Space)
      // -------------------------------------------------------
      const domainId = getDomainId(domain);

      const queryParams = new URLSearchParams({
        size: '20',
        page: '1',
        accountName,
        domainId
      });

      const res = await fetch(`${matchedProvider.apiUrl}?${queryParams}`, {

        method: 'GET',
        cache: 'no-store',
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: 'ไม่สามารถเชื่อมต่อระบบ Maily Space ได้ชั่วคราว' },
          { status: 500 }
        );
      }

      const data = await res.json();
      const mails = data?.data?.mails || data?.mails || [];

      if (mails.length === 0) {
        return NextResponse.json(
          { error: `ไม่พบกล่องข้อความใดๆ สำหรับอีเมล ${email} ในขณะนี้ กรุณากดส่งรหัส OTP ก่อน` },
          { status: 400 }
        );
      }

      // If specific mailId provided, return that specific mail
      if (mailId) {
        const specificMail = mails.find(m => (m.id || m._id) === mailId);
        if (specificMail) {
          const otpCode = extractOtpCode(specificMail.html, specificMail.text);
          return NextResponse.json({
            success: true,
            code: otpCode,
            html_body: specificMail.html || specificMail.text || '',
            subject: specificMail.subject || '',
            from: specificMail.from || '',
            date: specificMail.date || specificMail.createdAt || null,
          });
        }
      }

      // Filter by app
      for (const mail of mails) {
        if (matchesApp(mail.from, mail.subject, appId, senderList)) {
          const otpCode = extractOtpCode(mail.html, mail.text);
          matchingMails.push({
            id: mail.id || mail._id,
            subject: mail.subject || 'ไม่มีหัวข้อ',
            from: mail.from || '',
            otp: otpCode,
            html_body: mail.html || '',
            text: mail.text || '',
            date: mail.date || mail.createdAt || null,
          });
        }
      }

      // If still no match (app filter too strict), return latest mail OTP
      if (matchingMails.length === 0 && mails.length > 0) {
        const latest = mails[0];
        const otpCode = extractOtpCode(latest.html, latest.text);
        if (otpCode) {
          matchingMails.push({
            id: latest.id || latest._id,
            subject: latest.subject || 'ไม่มีหัวข้อ',
            from: latest.from || '',
            otp: otpCode,
            html_body: latest.html || '',
            text: latest.text || '',
            date: latest.date || latest.createdAt || null,
          });
        }
      }

    } else {
      // -------------------------------------------------------
      // Channel B: Private IMAP (from DB)
      // -------------------------------------------------------
      const imapSetting = await prisma.emailImapSetting.findUnique({
        where: { domain: lowerEmail }
      });

      if (imapSetting && imapSetting.isActive) {
        if (imapSetting.appId && imapSetting.appId !== appId) {
          return NextResponse.json(
            { error: `อีเมลนี้ถูกล็อกให้ใช้เฉพาะกับแอป ${imapSetting.appId} เท่านั้น` },
            { status: 400 }
          );
        }

        const config = {
          imap: {
            user: imapSetting.user,
            password: imapSetting.password,
            host: imapSetting.host,
            port: imapSetting.port,
            tls: imapSetting.tls,
            authTimeout: 10000,
            tlsOptions: { rejectUnauthorized: false }
          }
        };

        try {
          const connection = await imaps.connect(config);
          await connection.openBox('INBOX');

          const delay = 3 * 3600 * 1000;
          const sinceDate = new Date(Date.now() - delay);
          const searchCriteria = ['ALL', ['SINCE', sinceDate.toISOString()]];
          const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], struct: true, markSeen: false };

          const messages = await connection.search(searchCriteria, fetchOptions);

          for (const item of messages) {
            const allPart = item.parts.find(part => part.which === '');
            if (!allPart) continue;

            const id = item.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";
            const mailBuffer = Buffer.concat([Buffer.from(idHeader), Buffer.from(allPart.body)]);

            const parsed = await simpleParser(mailBuffer);
            const fromLine = parsed.from?.text || '';
            const subjectLine = parsed.subject || '';

            if (matchesApp(fromLine, subjectLine, appId, senderList)) {
              const htmlBody = parsed.html || parsed.textAsHtml || parsed.text || '';
              const otpCode = extractOtpCode(htmlBody, parsed.text || '');

              matchingMails.push({
                subject: subjectLine,
                from: fromLine,
                otp: otpCode,
                html_body: htmlBody,
                date: parsed.date || item.attributes.date
              });
            }
          }
          connection.end();
          matchingMails.sort((a, b) => new Date(b.date) - new Date(a.date));

        } catch (imapErr) {
          console.error('[IMAP FETCH ERROR]:', imapErr);
          return NextResponse.json(
            { error: 'ดึงอีเมลไม่สำเร็จ (กรุณาเช็คว่ารหัสผ่าน/App Password ถูกต้องหรือไม่)' },
            { status: 500 }
          );
        }

      } else {
        return NextResponse.json(
          { error: `อีเมลโดเมน @${domain} ไม่ได้รับการรองรับในขณะนี้ กรุณาใช้ @lico.moe หรือ @rdcw.plus` },
          { status: 400 }
        );
      }
    }

    if (matchingMails.length === 0) {
      return NextResponse.json(
        { error: `ไม่พบอีเมล OTP ล่าสุดสำหรับ ${appId} ในกล่องข้อความนี้` },
        { status: 400 }
      );
    }

    const latestMail = matchingMails[0];

    return NextResponse.json({
      success: true,
      code: latestMail.otp || null,
      html_body: latestMail.html_body || '',
      subject: latestMail.subject || '',
      from: latestMail.from || '',
      date: latestMail.date || null,
    });

  } catch (error) {
    console.error('[OTP FETCH API ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}

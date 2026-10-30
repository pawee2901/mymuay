import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { extractOtpCode, matchesApp, fetchImapMails } from '@/lib/otpMail';

export const dynamic = 'force-dynamic';

const MAILY_API_URL = process.env.MAILY_API_URL || "https://api.maily.space/mail/public/mails";

// Convert domain to maily domainId: lico.moe -> licomoe
function getDomainId(domain) {
  return domain.trim().replace(/\./g, '');
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
    let regexPattern = null;

    try {
      const dbApp = await prisma.otpApp.findUnique({
        where: { id: appId }
      });
      if (dbApp && dbApp.senderEmails) {
        senderList = dbApp.senderEmails.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      }
      regexPattern = dbApp?.regexPattern || null;
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
          const otpCode = extractOtpCode(specificMail.html, specificMail.text, { regexPattern });
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
          const otpCode = extractOtpCode(mail.html, mail.text, { regexPattern });
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



    } else {
      // -------------------------------------------------------
      // Channel B: Private IMAP (from DB)
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
        if (imapSetting.appId && imapSetting.appId !== appId) {
          return NextResponse.json(
            { error: `อีเมลนี้ถูกล็อกให้ใช้เฉพาะกับแอป ${imapSetting.appId} เท่านั้น` },
            { status: 400 }
          );
        }

        try {
          const mails = await fetchImapMails(imapSetting, {
            email: lowerEmail,
            sinceHours: 3,
            limit: 5,
            uid: mailId && /^\d+$/.test(String(mailId)) ? mailId : undefined,
            filter: mailId ? undefined : ({ from, subject }) => matchesApp(from, subject, appId, senderList),
          });

          for (const mail of mails) {
            matchingMails.push({
              subject: mail.subject,
              from: mail.from,
              otp: extractOtpCode(mail.html, mail.text, { regexPattern }),
              html_body: mail.html,
              date: mail.date,
            });
          }

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

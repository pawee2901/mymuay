import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { extractOtpCode, fetchImapMails } from '@/lib/otpMail';

export const dynamic = 'force-dynamic';

function getDomainId(domain) {
  return domain.trim().replace(/\./g, '');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').toLowerCase().trim();
    const size  = parseInt(searchParams.get('size') || '20');

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'กรุณาระบุอีเมลให้ถูกต้อง' }, { status: 400 });
    }

    const [accountName, domain] = email.split('@');
    const lowerDomain = domain.toLowerCase().trim();

    // Query active providers from DB
    let activeProviders = [];
    try {
      activeProviders = await prisma.otpProvider.findMany({
        where: { isActive: true }
      });
    } catch (dbErr) {
      console.error('[INBOX] Error fetching providers:', dbErr);
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

    // ── A: Dynamic OTP API Provider (Maily Space) ────────────────────────────
    if (matchedProvider) {
      const domainId = getDomainId(domain);
      const res = await fetch(
        `${matchedProvider.apiUrl}?accountName=${accountName}&domainId=${domainId}&size=${size}&page=1`,
        { cache: 'no-store', headers: { 'Content-Type': 'application/json' } }
      );
      if (!res.ok) {
        return NextResponse.json({ error: 'Maily API ขัดข้องชั่วคราว' }, { status: 500 });
      }
      const data = await res.json();
      const mails = data?.data?.mails || data?.mails || [];
      return NextResponse.json({
        success: true,
        source: 'maily',
        email,
        mails: mails.map(m => ({
          id:      m.id || m._id,
          subject: m.subject || '(ไม่มีหัวข้อ)',
          from:    m.from || '',
          date:    m.date || m.createdAt || null,
          preview: (m.text || m.subject || '').substring(0, 120),
          hasOtp:  !!extractOtpCode(m.html || '', m.text || ''),
        })),
      });
    }

    // ── B: DB pre-saved IMAP credentials ────────────────────────────────
    // Look up by exact email first, then by domain (catch-all)
    const setting =
      await prisma.emailImapSetting.findFirst({
        where: { OR: [{ domain: email }, { domain }], isActive: true }
      });

    if (!setting) {
      return NextResponse.json({
        error: `ไม่พบการตั้งค่าสำหรับ ${email} — กรุณาให้แอดมินเพิ่มอีเมลนี้ในระบบก่อนค่ะ`,
        notConfigured: true,
      }, { status: 404 });
    }

    try {
      const mails = await fetchImapMails(setting, { email, sinceHours: 6, limit: Math.min(size || 20, 30) });
      return NextResponse.json({
        success: true,
        source: 'imap',
        email,
        mails: mails.map(m => ({
          id:      m.id,
          subject: m.subject || '(ไม่มีหัวข้อ)',
          from:    m.from,
          date:    m.date,
          preview: (m.text || m.subject || '').substring(0, 120),
          hasOtp:  !!extractOtpCode(m.html, m.text),
          html:    m.html,
        })),
      });
    } catch (imapErr) {
      console.error('[INBOX IMAP ERROR]:', imapErr.message);
      return NextResponse.json({
        error: 'เชื่อมต่อ IMAP ไม่สำเร็จ — กรุณาตรวจสอบการตั้งค่าในหน้า Admin',
      }, { status: 500 });
    }

  } catch (err) {
    console.error('[INBOX API ERROR]:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}

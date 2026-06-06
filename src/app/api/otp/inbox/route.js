import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export const dynamic = 'force-dynamic';

const MAILY_API_URL = process.env.MAILY_API_URL || 'https://api.maily.space/mail/public/mails';
const MAILY_DOMAINS = (process.env.MAILY_DOMAINS || 'lico.moe,rdcw.plus,gooddaymail.com,rdcw.co.th')
  .split(',').map(d => d.trim());

function getDomainId(domain) {
  return domain.trim().replace(/\./g, '');
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

  const m6 = content.match(/\b(\d{6})\b/);
  if (m6) return m6[1];
  const m48 = content.match(/\b(\d{4,8})\b/);
  if (m48) return m48[1];
  return null;
}

async function fetchFromImap(setting) {
  const config = {
    imap: {
      user: setting.user,
      password: setting.password,
      host: setting.host,
      port: setting.port,
      tls: setting.tls,
      authTimeout: 15000,
      connTimeout: 15000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };
  const connection = await imaps.connect(config);
  await connection.openBox('INBOX');

  const sinceDate = new Date(Date.now() - 6 * 3600 * 1000);
  const messages = await connection.search(
    ['ALL', ['SINCE', sinceDate.toISOString()]],
    { bodies: [''], struct: true, markSeen: false }
  );
  connection.end();

  const parsed = [];
  for (const item of messages) {
    const part = item.parts.find(p => p.which === '');
    if (!part) continue;
    try {
      const mail = await simpleParser(Buffer.from(part.body));
      parsed.push({
        id:      String(item.attributes.uid),
        subject: mail.subject || '(ไม่มีหัวข้อ)',
        from:    mail.from?.text || '',
        date:    mail.date || item.attributes.date,
        html:    mail.html || mail.textAsHtml || '',
        text:    mail.text || '',
      });
    } catch { /* skip */ }
  }
  // newest first
  parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
  return parsed;
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

    // ── A: Maily Space (public, no password) ────────────────────────────
    if (MAILY_DOMAINS.includes(domain)) {
      const domainId = getDomainId(domain);
      const res = await fetch(
        `${MAILY_API_URL}?accountName=${accountName}&domainId=${domainId}&size=${size}&page=1`,
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
      const mails = await fetchFromImap(setting);
      return NextResponse.json({
        success: true,
        source: 'imap',
        email,
        mails: mails.map(m => ({
          id:      m.id,
          subject: m.subject,
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

import { NextResponse } from 'next/server';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export const dynamic = 'force-dynamic';

// -------------------------------------------------------
// IMAP presets สำหรับ email provider ยอดนิยม
// -------------------------------------------------------
const IMAP_PRESETS = {
  'gmail.com':          { host: 'imap.gmail.com',             port: 993, tls: true  },
  'googlemail.com':     { host: 'imap.gmail.com',             port: 993, tls: true  },
  'hotmail.com':        { host: 'outlook.office365.com',      port: 993, tls: true  },
  'outlook.com':        { host: 'outlook.office365.com',      port: 993, tls: true  },
  'outlook.co.th':      { host: 'outlook.office365.com',      port: 993, tls: true  },
  'live.com':           { host: 'outlook.office365.com',      port: 993, tls: true  },
  'msn.com':            { host: 'outlook.office365.com',      port: 993, tls: true  },
  'yahoo.com':          { host: 'imap.mail.yahoo.com',        port: 993, tls: true  },
  'yahoo.co.th':        { host: 'imap.mail.yahoo.com',        port: 993, tls: true  },
  'ymail.com':          { host: 'imap.mail.yahoo.com',        port: 993, tls: true  },
  'icloud.com':         { host: 'imap.mail.me.com',           port: 993, tls: true  },
  'me.com':             { host: 'imap.mail.me.com',           port: 993, tls: true  },
  'mac.com':            { host: 'imap.mail.me.com',           port: 993, tls: true  },
  'protonmail.com':     { host: '127.0.0.1',                  port: 1143, tls: false }, // ProtonMail Bridge
  'proton.me':          { host: '127.0.0.1',                  port: 1143, tls: false },
  'zoho.com':           { host: 'imap.zoho.com',              port: 993, tls: true  },
  'aol.com':            { host: 'imap.aol.com',               port: 993, tls: true  },
  'gmx.com':            { host: 'imap.gmx.com',               port: 993, tls: true  },
  'mail.com':           { host: 'imap.mail.com',              port: 993, tls: true  },
  'tutanota.com':       { host: 'imap.tutanota.com',          port: 993, tls: true  },
  // Thai providers
  'thaimail.com':       { host: 'mail.thaimail.com',          port: 993, tls: true  },
  'windowslive.com':    { host: 'outlook.office365.com',      port: 993, tls: true  },
};

function getImapPreset(domain) {
  const lower = (domain || '').toLowerCase().trim();
  return IMAP_PRESETS[lower] || null;
}

function matchesApp(from, subject, appId) {
  const lf = (from || '').toLowerCase();
  const ls = (subject || '').toLowerCase();
  const la = (appId || '').toLowerCase();

  if (la === 'other' || la === 'อื่นๆ') return true; // "other" matches everything

  if (la.includes('netflix')) return lf.includes('netflix') || ls.includes('netflix');
  if (la.includes('disney')) return lf.includes('disney') || ls.includes('disney');
  if (la.includes('trueid') || la.includes('true')) return lf.includes('trueid') || ls.includes('trueid') || lf.includes('true') || ls.includes('true');
  if (la.includes('chat') || la.includes('openai') || la.includes('gpt')) return lf.includes('openai') || ls.includes('openai') || lf.includes('chatgpt') || ls.includes('chatgpt');
  if (la.includes('prime') || la.includes('amazon')) return lf.includes('prime') || ls.includes('prime') || lf.includes('amazon') || ls.includes('amazon');
  if (la.includes('spotify')) return lf.includes('spotify') || ls.includes('spotify');
  if (la.includes('youtube')) return lf.includes('youtube') || ls.includes('youtube') || lf.includes('google') || ls.includes('google');

  return lf.includes(la) || ls.includes(la);
}

function extractOtpCode(html, text) {
  const content = (text || '') + ' ' + (html || '').replace(/<[^>]*>?/gm, ' ');
  let m = content.match(/\b(\d{6})\b/);
  if (m) return m[1];
  m = content.match(/\b(\d{4,8})\b/);
  if (m) return m[1];
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      appId,
      // Optional overrides
      imapHost,
      imapPort,
      imapTls,
    } = body;

    if (!email || !email.includes('@') || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบ' }, { status: 400 });
    }

    const [, domain] = email.toLowerCase().trim().split('@');
    const preset = getImapPreset(domain);

    const host = imapHost || preset?.host;
    const port = parseInt(imapPort || preset?.port || '993');
    const tls  = imapTls !== undefined ? imapTls : (preset?.tls ?? true);

    if (!host) {
      return NextResponse.json({
        error: `ไม่พบ IMAP server สำหรับ @${domain} กรุณาระบุ IMAP Host ด้วยตัวเอง`,
        needManualImap: true,
        domain
      }, { status: 400 });
    }

    const config = {
      imap: {
        user: email.trim(),
        password: password.trim(),
        host,
        port,
        tls,
        authTimeout: 15000,
        connTimeout: 15000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    let connection;
    try {
      connection = await imaps.connect(config);
    } catch (connErr) {
      console.error('[IMAP CONNECT ERROR]:', connErr.message);
      return NextResponse.json({
        error: 'เชื่อมต่อไม่ได้ — กรุณาตรวจสอบ: (1) อีเมล/รหัสผ่านถูกต้อง (2) เปิดใช้ IMAP ในบัญชีแล้ว (3) สำหรับ Gmail/Hotmail ต้องใช้ App Password ค่ะ',
        hint: getProviderHint(domain)
      }, { status: 401 });
    }

    await connection.openBox('INBOX');

    // ค้นหาอีเมลย้อนหลัง 6 ชั่วโมง
    const sinceDate = new Date(Date.now() - 6 * 3600 * 1000);
    const searchCriteria = ['ALL', ['SINCE', sinceDate.toISOString()]];
    const fetchOptions = { bodies: [''], struct: true, markSeen: false };

    const messages = await connection.search(searchCriteria, fetchOptions);
    connection.end();

    const parsed_mails = [];
    for (const item of messages) {
      const allPart = item.parts.find(p => p.which === '');
      if (!allPart) continue;

      try {
        const parsed = await simpleParser(Buffer.from(allPart.body));
        parsed_mails.push({
          uid:     item.attributes.uid,
          subject: parsed.subject || '(ไม่มีหัวข้อ)',
          from:    parsed.from?.text || '',
          date:    parsed.date || item.attributes.date,
          html:    parsed.html || parsed.textAsHtml || '',
          text:    parsed.text || '',
        });
      } catch { /* skip unparseable */ }
    }

    // Sort newest first
    parsed_mails.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by app (or return all if appId=other)
    let matchingMails = parsed_mails.filter(m => matchesApp(m.from, m.subject, appId || 'other'));

    // Fallback: return all with OTP if no app-match
    if (matchingMails.length === 0) {
      matchingMails = parsed_mails.filter(m => extractOtpCode(m.html, m.text));
    }

    // Build inbox list response
    const inboxList = parsed_mails.map(m => ({
      id:      String(m.uid),
      subject: m.subject,
      from:    m.from,
      date:    m.date,
      preview: (m.text || m.subject || '').substring(0, 120),
      hasOtp:  !!extractOtpCode(m.html, m.text),
    }));

    if (matchingMails.length === 0) {
      return NextResponse.json({
        success: false,
        inbox: inboxList,
        error: `ไม่พบอีเมล OTP ของ ${appId} ในกล่องจดหมาย 6 ชม.ล่าสุด`
      }, { status: 400 });
    }

    const latest = matchingMails[0];
    const otpCode = extractOtpCode(latest.html, latest.text);

    return NextResponse.json({
      success: true,
      code:     otpCode,
      html_body: latest.html || '',
      subject:  latest.subject,
      from:     latest.from,
      date:     latest.date,
      inbox:    inboxList,
    });

  } catch (error) {
    console.error('[IMAP FETCH API ERROR]:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ: ' + error.message }, { status: 500 });
  }
}

// GET: ตรวจสอบว่า domain รองรับ preset ไหม
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = (searchParams.get('domain') || '').toLowerCase().trim();
  const preset = getImapPreset(domain);

  return NextResponse.json({
    domain,
    supported: !!preset,
    preset: preset ? { host: preset.host, port: preset.port, tls: preset.tls } : null,
    hint: getProviderHint(domain),
  });
}

function getProviderHint(domain) {
  const lower = (domain || '').toLowerCase();
  if (lower.includes('gmail') || lower.includes('googlemail')) {
    return 'Gmail: ต้องเปิด "2-Step Verification" แล้วสร้าง "App Password" ที่ myaccount.google.com/apppasswords';
  }
  if (lower.includes('hotmail') || lower.includes('outlook') || lower.includes('live') || lower.includes('msn')) {
    return 'Hotmail/Outlook: ต้องเปิด IMAP ที่ Settings > Mail > Sync email และใช้ App Password หากเปิด 2FA';
  }
  if (lower.includes('yahoo') || lower.includes('ymail')) {
    return 'Yahoo: ต้องสร้าง App Password ที่ login.yahoo.com > Security > App passwords';
  }
  if (lower.includes('icloud') || lower.includes('me.com') || lower.includes('mac.com')) {
    return 'iCloud: ต้องใช้ App-Specific Password จาก appleid.apple.com';
  }
  return 'กรุณาเปิดใช้งาน IMAP ในบัญชีอีเมลของคุณ และใช้ App Password หากมีการเปิด 2FA';
}

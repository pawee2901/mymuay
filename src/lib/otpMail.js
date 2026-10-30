import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

// Headers that may carry the customer's address on a catch-all / forwarded inbox
const RECIPIENT_HEADERS = [
  'to', 'cc', 'delivered-to', 'x-original-to', 'x-forwarded-to',
  'envelope-to', 'x-envelope-to', 'resent-to', 'x-rcpt-to',
];

const first = (h, key) => (Array.isArray(h?.[key]) ? h[key][0] : h?.[key]) || '';

/**
 * true when the mail was sent to `email`.
 * Mails whose headers name a *different* mailbox on the same domain are rejected
 * (another customer's mail on a catch-all inbox). Mails with no recognisable
 * recipient on that domain (e.g. rewritten by forwarding) are kept.
 */
export function isAddressedTo(headers, email) {
  const lower = (email || '').toLowerCase().trim();
  const domain = lower.split('@')[1];
  if (!lower || !domain) return true;
  const all = RECIPIENT_HEADERS.flatMap((k) => headers?.[k] || []).join(' ').toLowerCase();
  if (all.includes(lower)) return true;
  return !all.includes('@' + domain);
}

export function matchesApp(from, subject, appId, senderList = []) {
  const lf = (from || '').toLowerCase();
  const ls = (subject || '').toLowerCase();
  const la = (appId || '').toLowerCase();

  if (!la || la === 'other' || la === 'อื่นๆ') return true;

  if (senderList.length > 0 && senderList.some((s) => lf.includes(s) || ls.includes(s))) return true;

  if (la.includes('netflix')) return lf.includes('netflix') || ls.includes('netflix');
  if (la.includes('disney')) return lf.includes('disney') || ls.includes('disney');
  if (la.includes('true')) return lf.includes('trueid') || ls.includes('trueid') || lf.includes('true') || ls.includes('true');
  if (la.includes('chat') || la.includes('openai') || la.includes('gpt')) return lf.includes('openai') || ls.includes('openai') || lf.includes('chatgpt') || ls.includes('chatgpt');
  if (la.includes('prime') || la.includes('amazon')) return lf.includes('prime') || ls.includes('prime') || lf.includes('amazon') || ls.includes('amazon');
  if (la.includes('spotify')) return lf.includes('spotify') || ls.includes('spotify');
  if (la.includes('youtube')) return lf.includes('youtube') || ls.includes('youtube') || lf.includes('google') || ls.includes('google');

  return lf.includes(la) || ls.includes(la);
}

/**
 * Pull the OTP out of a mail. Order: admin regex (OtpApp.regexPattern) →
 * number right after a code keyword → 6 digits → any 4-8 digits.
 */
export function extractOtpCode(html = '', text = '', { regexPattern } = {}) {
  const cleanHtml = (html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/gi, ' ');

  const content = ((text || '') + ' ' + cleanHtml)
    .replace(/#([a-fA-F0-9]{3,8})\b/g, ' ') // hex colours
    .replace(/https?:\/\/\S+/g, ' ');        // ids inside links

  if (regexPattern) {
    try {
      const m = content.match(new RegExp(regexPattern, 'i'));
      if (m) return m[1] || m[0];
    } catch {
      console.error('[OTP] invalid regexPattern:', regexPattern);
    }
  }

  const keywordPatterns = [
    /(?:code|otp|passcode|verification|pin|รหัส|ยืนยัน)[\s:=_\-#.]*(\d{4,8})\b/i,
    /(\d{4,8})\s*(?:is your|คือรหัส|คือโค้ด)/i,
    // "Enter this code to sign in ... 1234" (Netflix and similar)
    /(?:code|รหัส)[^\d]{0,80}?\b(\d{4,8})\b/i,
  ];
  for (const p of keywordPatterns) {
    const m = content.match(p);
    if (m?.[1]) return m[1];
  }

  let m = content.match(/\b(\d{6})\b/);
  if (m) return m[1];
  m = content.match(/\b(\d{4,8})\b/);
  return m ? m[1] : null;
}

/**
 * Read recent mails for `email` from a saved IMAP mailbox (EmailImapSetting).
 * Scans headers of every mail in the window first, keeps only mails addressed
 * to `email` that pass `filter`, then downloads full bodies for the newest `limit`.
 * (The old code took the 5 newest mails of the whole inbox *before* filtering,
 * so on a busy catch-all inbox the customer's mail was usually never looked at.)
 */
export async function fetchImapMails(setting, { email, sinceHours = 6, limit = 5, filter, uid } = {}) {
  const connection = await imaps.connect({
    imap: {
      user: setting.user,
      password: setting.password,
      host: setting.host,
      port: setting.port,
      tls: setting.tls,
      authTimeout: 15000,
      connTimeout: 15000,
      tlsOptions: { rejectUnauthorized: false },
    },
  });

  try {
    await connection.openBox('INBOX');

    let uids;
    if (uid) {
      uids = [Number(uid)];
    } else {
      const since = new Date(Date.now() - sinceHours * 3600 * 1000);
      const headerMsgs = await connection.search([['SINCE', since]], { bodies: ['HEADER'], markSeen: false });

      uids = headerMsgs
        .map((item) => ({ uid: item.attributes.uid, h: item.parts.find((p) => p.which === 'HEADER')?.body || {} }))
        .filter(({ h }) => !email || isAddressedTo(h, email))
        .filter(({ h }) => !filter || filter({ from: first(h, 'from'), subject: first(h, 'subject') }))
        .map(({ uid: u }) => u)
        .sort((a, b) => b - a)
        .slice(0, limit);
    }

    if (uids.length === 0) return [];

    const full = await connection.search([['UID', uids.join(',')]], { bodies: [''], markSeen: false });
    const mails = [];
    for (const item of full) {
      const part = item.parts.find((p) => p.which === '');
      if (!part) continue;
      try {
        const parsed = await simpleParser(Buffer.from(part.body));
        mails.push({
          id: String(item.attributes.uid),
          subject: parsed.subject || '',
          from: parsed.from?.text || '',
          date: parsed.date || item.attributes.date,
          html: parsed.html || parsed.textAsHtml || parsed.text || '',
          text: parsed.text || '',
        });
      } catch { /* skip unparseable */ }
    }
    mails.sort((a, b) => new Date(b.date) - new Date(a.date));
    return mails;
  } finally {
    try { connection.end(); } catch { /* ignore */ }
  }
}

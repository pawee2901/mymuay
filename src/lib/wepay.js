import crypto from 'crypto';
import { prisma } from '@/db';

const WEPAY_API_URL = 'https://www.wepay.in.th/client_api.json.php';
const WEPAY_CATALOG_URL = 'https://www.wepay.in.th/comp_export.php?json';
const CATALOG_TTL_MS = 5 * 60 * 1000;

// Status codes from section 8 of the wePAY API document
export const WEPAY_CODE_MESSAGES = {
  '10001': 'wePAY: ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
  '10002': 'wePAY: รายการไม่สมบูรณ์',
  '10003': 'wePAY: มีการเรียกใช้งานถี่เกินไป กรุณาลองใหม่',
  '10004': 'wePAY: เกิดข้อผิดพลาดในการสร้างรายการใหม่',
  '20001': 'wePAY: Username หรือ Password ไม่ถูกต้อง',
  '20003': 'wePAY: Username หรือ Password ไม่ถูกต้อง',
  '20004': 'wePAY: Username นี้ยังไม่เปิดใช้งาน API',
  '20005': 'wePAY: IP ของเซิร์ฟเวอร์ยังไม่ได้รับอนุญาต',
  '30001': 'ไม่พบบริการที่ระบุ',
  '30002': 'Transaction ID ไม่ถูกต้อง',
  '30003': 'ไม่พบ Transaction ID ที่ระบุ',
  '30004': 'รายการอยู่ระหว่างดำเนินการ',
  '30005': 'Callback URL ไม่ถูกต้อง',
  '30006': 'เลขอ้างอิงรายการไม่ถูกต้อง',
  '30007': 'จำนวนเงินไม่ถูกต้อง',
  '30008': 'บริการไม่ถูกต้อง',
  '30009': 'ID ผู้เล่น / เบอร์โทร ไม่ถูกต้อง',
  '30010': 'ข้อมูลอ้างอิง 2 ไม่ถูกต้อง',
  '30011': 'ข้อมูลอ้างอิง 3 ไม่ถูกต้อง',
  '30012': 'ข้อมูลอ้างอิง 4 ไม่ถูกต้อง',
  '30013': 'บาร์โค้ดไม่ถูกต้อง',
  '30016': 'รายการซ้ำ',
  '30017': 'เลือกบริการไม่ถูกต้อง',
  '30018': 'ยอดเงินไม่ถูกต้อง',
  '30019': 'ร้านค้ายังไม่พร้อมให้บริการชั่วคราว (ยอดเงินระบบไม่เพียงพอ)',
  '30020': 'ไม่อนุญาตให้ชำระเงินให้กับบริการนี้',
};

export class WepayError extends Error {
  constructor(code, message) {
    super(message || WEPAY_CODE_MESSAGES[code] || `wePAY error ${code}`);
    this.code = code;
  }
}

async function getCredentials() {
  const setting = await prisma.depositSetting.findUnique({ where: { id: 'default' } }).catch(() => null);
  const username = (setting?.wepayUsername || process.env.WEPAY_USERNAME || '').trim();
  const password = (setting?.wepayPassword || process.env.WEPAY_PASSWORD || '').trim();

  if (!username || !password) {
    throw new WepayError('CONFIG', 'ยังไม่ได้ตั้งค่า Username / Password ของ wePAY (เมนูแอดมิน > การชำระเงิน)');
  }

  return {
    username,
    password_hash: crypto.createHash('md5').update(password).digest('hex'),
  };
}

async function callWepay(payload) {
  const credentials = await getCredentials();
  const response = await fetch(WEPAY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...credentials, ...payload }),
    cache: 'no-store',
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new WepayError('HTTP', `wePAY ตอบกลับไม่ใช่ JSON (HTTP ${response.status}): ${text.slice(0, 160)}`);
  }

  if (data.code !== '00000') {
    throw new WepayError(data.code, WEPAY_CODE_MESSAGES[data.code] || data.desc);
  }

  return data;
}

export async function getWepayBalance() {
  return callWepay({ type: 'balance_inquiry' });
}

export async function createWepayPayment({ type, company, amount, ref1, destRef, respUrl }) {
  return callWepay({
    type,
    resp_url: respUrl,
    dest_ref: destRef,
    pay_to_amount: String(amount),
    pay_to_company: company,
    pay_to_ref1: type === 'cashcard' ? '0000000000' : ref1,
  });
}

// Returns the callback fields wePAY sent (or would send) for this transaction,
// or null while the transaction is still being processed.
export async function getWepayOutput(transactionId) {
  try {
    const data = await callWepay({ type: 'get_output', transaction_id: String(transactionId) });
    return Object.fromEntries(new URLSearchParams(data.output || ''));
  } catch (error) {
    if (error.code === '30004') return null;
    throw error;
  }
}

let catalogCache = { at: 0, data: null };

export async function getWepayCatalog({ force = false } = {}) {
  if (!force && catalogCache.data && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return catalogCache.data;
  }

  const response = await fetch(WEPAY_CATALOG_URL, { cache: 'no-store' });
  const json = await response.json();
  catalogCache = { at: Date.now(), data: json.data || {} };
  return catalogCache.data;
}

export async function findWepayCompany(type, companyId) {
  const catalog = await getWepayCatalog();
  return (catalog[type] || []).find((company) => company.company_id === companyId) || null;
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<\/+(div|p|small)>|<br\s*\/?>/gi, ' ') // wePAY sometimes emits "<//div>"
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "<b>30 บาท</b> ได้รับ 55 Diamonds<small>สำหรับการซื้อครั้งแรก</small>" => "30 บาท ได้รับ 55 Diamonds • สำหรับการซื้อครั้งแรก"
export function denominationLabel(denomination, type) {
  const html = String(denomination.description || '');
  const main = stripHtml(html.replace(/<small>[\s\S]*?(<\/small>|$)/gi, ' '));
  const note = stripHtml((html.match(/<small>([\s\S]*?)(<\/small>|$)/i) || [])[1]);
  if (main) return note && note.length <= 40 ? `${main} • ${note}` : main;
  return type === 'cashcard' ? `บัตร ${denomination.price.toLocaleString()} บาท` : `${denomination.price.toLocaleString()} บาท`;
}

export function generateDestRef() {
  // a-z A-Z 0-9, max 20 chars
  return `MY${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`.toUpperCase().slice(0, 20);
}

export function signDestRef(destRef) {
  const secret = process.env.JWT_SECRET || 'supersecretkeyforwebshopphatstorestyle123';
  return crypto.createHmac('sha256', secret).update(`wepay:${destRef}`).digest('hex').slice(0, 32);
}

export function getPublicBaseUrl(request) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  return `${proto}://${host}`;
}

export function buildCallbackUrl(baseUrl, destRef) {
  return `${baseUrl}/api/wepay/callback?sig=${signDestRef(destRef)}`;
}

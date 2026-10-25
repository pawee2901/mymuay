// Helpers for wePAY refs_format (PHP-style regex) — safe to import on client and server.

const FIELD_LABELS = {
  MLBB: ['User ID', 'Zone ID'],
  MAGICCHESS: ['User ID', 'Zone ID'],
  HEARTOPIA: ['AID (ตัวเลข 15-20 หลัก)', 'UID'],
  'DRAGONN-MC': ['Character ID', 'Server ID'],
  'VALORANT-D': ['Riot ID (เช่น Name#TAG)'],
  'MPS-RE': ['Account ID', 'Character ID'],
};

export function phpRegexToJs(phpRegex) {
  if (!phpRegex || typeof phpRegex !== 'string') return null;
  const lastSlash = phpRegex.lastIndexOf('/');
  if (!phpRegex.startsWith('/') || lastSlash <= 0) return null;

  let source = phpRegex.slice(1, lastSlash);
  let flags = phpRegex.slice(lastSlash + 1).replace(/[^imsu]/g, '');

  if (/\\x\{[0-9a-fA-F]+\}/.test(source)) {
    source = source.replace(/\\x\{([0-9a-fA-F]+)\}/g, '\\u{$1}');
    if (!flags.includes('u')) flags += 'u';
  }

  try {
    return new RegExp(source, flags);
  } catch {
    return null;
  }
}

// Number of space-separated parts the ref1 expects, e.g. "12345 6789" (MLBB) => 2
export function countRefParts(phpRegex) {
  if (!phpRegex) return 1;
  let inClass = false;
  let parts = 1;
  for (let i = 0; i < phpRegex.length; i++) {
    const ch = phpRegex[i];
    if (ch === '\\') { i++; continue; }
    if (ch === '[') inClass = true;
    else if (ch === ']') inClass = false;
    else if (ch === ' ' && !inClass) parts++;
  }
  return parts;
}

export function parseServers(json) {
  try {
    const list = JSON.parse(json || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Describes the inputs the customer must fill for a wePAY product
export function getRefFields({ wepayType, wepayCompany, wepayRefFormat, wepayServers }) {
  if (wepayType === 'cashcard') return { fields: [], servers: [] };
  if (wepayType === 'mtopup') return { fields: ['เบอร์โทรศัพท์'], servers: [] };

  const servers = parseServers(wepayServers);
  const totalParts = countRefParts(wepayRefFormat);
  const textParts = Math.max(1, servers.length ? totalParts - 1 : totalParts);
  const preset = FIELD_LABELS[wepayCompany] || [];
  const fields = Array.from({ length: textParts }, (_, i) => preset[i] || (i === 0 ? 'ID ผู้เล่น (UID)' : `ข้อมูลช่องที่ ${i + 1}`));

  return { fields, servers };
}

export function validateRef(ref1, wepayRefFormat) {
  const regex = phpRegexToJs(wepayRefFormat);
  if (!regex) return true; // unknown format: let wePAY validate
  return regex.test(ref1);
}

// PromptPay (Thai QR, EMVCo) payload generator — safe to use on client and server.

function field(id, value) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function normalizePromptpayId(id) {
  return String(id || '').replace(/[^0-9]/g, '');
}

export function isValidPromptpayId(id) {
  const digits = normalizePromptpayId(id);
  return /^0\d{9}$/.test(digits) || digits.length === 13 || digits.length === 15;
}

export function buildPromptpayPayload(id, amount) {
  const digits = normalizePromptpayId(id);
  let account;
  if (digits.length === 15) {
    account = field('03', digits); // e-wallet
  } else if (digits.length === 13) {
    account = field('02', digits); // national ID / tax ID
  } else {
    account = field('01', `0066${digits.replace(/^0/, '')}`.padStart(13, '0')); // mobile number
  }

  const hasAmount = Number(amount) > 0;
  const body = [
    field('00', '01'),
    field('01', hasAmount ? '12' : '11'),
    field('29', field('00', 'A000000677010111') + account),
    field('53', '764'),
    hasAmount ? field('54', Number(amount).toFixed(2)) : '',
    field('58', 'TH'),
  ].join('');

  const withCrcTag = `${body}6304`;
  return withCrcTag + crc16(withCrcTag);
}

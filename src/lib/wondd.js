const WONDD_API_URL = process.env.WONDD_API_URL || 'https://www.wondd.com/member/bot-game.php';
const WONDD_PACKLIST_URL = process.env.WONDD_PACKLIST_URL || 'https://www.wondd.com/member/bot-game-packlist.php';

function getCredentials() {
  const username = process.env.WONDD_USERNAME;
  const password = process.env.WONDD_PASSWORD;

  if (!username || !password) {
    throw new Error('ยังไม่ได้ตั้งค่า WONDD_USERNAME และ WONDD_PASSWORD ในไฟล์ .env');
  }

  return { username, password };
}

async function postWondd(params) {
  const response = await fetch(WONDD_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
    cache: 'no-store',
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`WonDD ตอบกลับไม่ใช่ JSON: ${text.slice(0, 160)}`);
  }

  if (!response.ok) {
    throw new Error(`WonDD HTTP ${response.status}: ${data.errordetail || response.statusText}`);
  }

  return data;
}

export async function topupGame({ serviceCode, packCode, gameId }) {
  const { username, password } = getCredentials();

  if (!serviceCode) throw new Error('ยังไม่ได้ตั้งค่า servicecode ของเกมนี้');
  if (!packCode) throw new Error('ยังไม่ได้ตั้งค่า packcode ของแพ็กเกจนี้');
  if (!gameId) throw new Error('ยังไม่ได้กรอก Player ID / UID');

  const data = await postWondd({
    method: 'topup',
    username,
    password,
    servicecode: serviceCode,
    packcode: packCode,
    gameid: gameId,
  });

  if (data.errorcode !== '00') {
    throw new Error(data.errordetail || `WonDD error ${data.errorcode || 'UNKNOWN'}`);
  }

  return data;
}

export async function checkGameTopupStatus(orderId) {
  const { username, password } = getCredentials();

  if (!orderId) throw new Error('ไม่พบ WonDD orderid');

  const data = await postWondd({
    method: 'checkstatus',
    username,
    password,
    orderid: orderId,
  });

  if (data.errorcode !== '00') {
    throw new Error(data.errordetail || `WonDD error ${data.errorcode || 'UNKNOWN'}`);
  }

  return data;
}

export async function getWonddBalance() {
  const { username, password } = getCredentials();

  const data = await postWondd({
    method: 'balance',
    username,
    password,
  });

  if (data.errorcode !== '00') {
    throw new Error(data.errordetail || `WonDD error ${data.errorcode || 'UNKNOWN'}`);
  }

  return data;
}

export async function getWonddPackList(game) {
  const url = new URL(WONDD_PACKLIST_URL);
  if (game) url.searchParams.set('game', game);

  const response = await fetch(url, { cache: 'no-store' });
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`WonDD packlist ตอบกลับไม่ใช่ JSON: ${text.slice(0, 160)}`);
  }
}

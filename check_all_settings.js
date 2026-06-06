const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new Database(dbPath);

try {
  const rows = db.prepare("SELECT * FROM DepositSetting").all();
  console.log('--- All Deposit Settings ---');
  console.log(JSON.stringify(rows, null, 2));
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}

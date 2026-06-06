const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const stats = fs.statSync(dbPath);
console.log('Database mtime:', stats.mtime);
console.log('Database size:', stats.size);

const db = new Database(dbPath);

try {
  // Check settings
  const settings = db.prepare("SELECT * FROM DepositSetting").all();
  console.log('\n--- Deposit Settings ---');
  console.log(JSON.stringify(settings, null, 2));

  // Check recent transactions
  const txs = db.prepare("SELECT * FROM DepositTransaction ORDER BY id DESC LIMIT 5").all();
  console.log('\n--- Recent Deposit Transactions ---');
  console.log(JSON.stringify(txs, null, 2));

  // Check recent slip verifications
  const slips = db.prepare("SELECT * FROM SlipVerification ORDER BY id DESC LIMIT 5").all();
  console.log('\n--- Recent Slip Verifications ---');
  console.log(JSON.stringify(slips, null, 2));

} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}

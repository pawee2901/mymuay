const Database = require('better-sqlite3');
const db = new Database('d:/mymuayy/prisma/dev.db', { verbose: console.log });

try {
  const row = db.prepare("SELECT * FROM DepositSetting WHERE id = 'default'").get();
  console.log('--- Current Deposit Settings (Direct SQL) ---');
  console.log(JSON.stringify(row, null, 2));
  console.log('---------------------------------------------');
} catch (err) {
  console.error('SQL Query Error:', err);
} finally {
  db.close();
}

const Database = require('better-sqlite3');
const path = require('path');

const rootDbPath = path.join(__dirname, 'dev.db');
console.log('Connecting to root database at:', rootDbPath);

try {
  const db = new Database(rootDbPath);
  const row = db.prepare("SELECT * FROM DepositSetting WHERE id = 'default'").get();
  console.log('--- Root Database Settings ---');
  console.log('SlipOk API Key:', JSON.stringify(row?.slipOkApiKey));
  console.log('SlipOk Branch ID:', JSON.stringify(row?.slipOkBranchId));
  db.close();
} catch (err) {
  console.error('Error opening root database:', err.message);
}

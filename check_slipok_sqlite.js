const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
console.log('Connecting to database at:', dbPath);

const db = new Database(dbPath);

try {
  const row = db.prepare("SELECT * FROM DepositSetting WHERE id = 'default'").get();
  console.log('--- Database Settings ---');
  console.log('SlipOk API Key:', JSON.stringify(row?.slipOkApiKey));
  console.log('SlipOk Branch ID:', JSON.stringify(row?.slipOkBranchId));
  console.log('--- Env Settings ---');
  console.log('SLIPOK_API_KEY:', JSON.stringify(process.env.SLIPOK_API_KEY));
  console.log('SLIPOK_BRANCH_ID:', JSON.stringify(process.env.SLIPOK_BRANCH_ID));
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}

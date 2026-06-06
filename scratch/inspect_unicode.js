const Database = require('better-sqlite3');
const db = new Database('d:/mymuayy/prisma/dev.db');

try {
  const row = db.prepare("SELECT * FROM DepositSetting WHERE id = 'default'").get();
  const key = row?.slipOkApiKey || '';
  const branch = row?.slipOkBranchId || '';
  
  console.log('API Key char codes:');
  for (let i = 0; i < key.length; i++) {
    console.log(`char[${i}]: "${key[i]}" (code: ${key.charCodeAt(i)})`);
  }
  
  console.log('\nBranch ID char codes:');
  for (let i = 0; i < branch.length; i++) {
    console.log(`char[${i}]: "${branch[i]}" (code: ${branch.charCodeAt(i)})`);
  }
} catch (err) {
  console.error(err);
} finally {
  db.close();
}

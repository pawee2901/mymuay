const Database = require('better-sqlite3');
const db = new Database('d:/mymuayy/prisma/dev.db');

try {
  db.prepare("UPDATE DepositSetting SET slipOkApiKey = ?, slipOkBranchId = ? WHERE id = 'default'")
    .run('SLIPOKD32J93D', '68219');
  
  const row = db.prepare("SELECT slipOkApiKey, slipOkBranchId FROM DepositSetting WHERE id = 'default'").get();
  console.log('Updated successfully!');
  console.log('SlipOk API Key:', row.slipOkApiKey);
  console.log('SlipOk Branch ID:', row.slipOkBranchId);
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}

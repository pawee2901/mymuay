const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new Database(dbPath);

try {
  const options = db.prepare("SELECT * FROM ProductOption WHERE productId = 'heartopia_cat_topup'").all();
  console.log('--- Heartopia Options ---');
  console.log(options);
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}

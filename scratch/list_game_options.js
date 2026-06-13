const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new Database(dbPath);

try {
  const options = db.prepare("SELECT * FROM ProductOption WHERE productId = 'rov_cat_topup' ORDER BY price ASC").all();
  console.log('--- ROV Options ---');
  options.forEach((opt, idx) => {
    console.log(`${idx}. ID=${opt.id} | Name=${opt.name} | Price=${opt.price} | Position=${opt.position}`);
  });
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}

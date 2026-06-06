const Database = require('better-sqlite3');
const dbPath = 'D:\\mymuayy\\prisma\\dev.db';

try {
  const db = new Database(dbPath);
  const categories = db.prepare('SELECT * FROM Category').all();
  console.log('--- ALL CATEGORIES ---');
  console.log(categories);
  db.close();
} catch (err) {
  console.error(err);
}

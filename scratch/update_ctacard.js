const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new Database(dbPath);

try {
  const result = db.prepare("UPDATE CtaCard SET linkUrl = '/games' WHERE id = 'card4'").run();
  console.log('Update card4 linkUrl result:', result);
  
  const card = db.prepare("SELECT * FROM CtaCard WHERE id = 'card4'").get();
  console.log('Updated card4:', card);
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}

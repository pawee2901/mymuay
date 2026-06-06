const Database = require('better-sqlite3');

const dbPath = 'd:\\mymuayy\\dev.db';
console.log('Inspecting root database at:', dbPath);

try {
  const db = new Database(dbPath);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables found:', tables.map(t => t.name));
  
  tables.forEach((t) => {
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM "${t.name}"`).get();
    console.log(`- Table ${t.name}: ${count.cnt} rows`);
    if (count.cnt > 0) {
      const sample = db.prepare(`SELECT * FROM "${t.name}" LIMIT 2`).all();
      console.log('  Sample:', sample);
    }
  });
  
  db.close();
} catch (err) {
  console.error('Error:', err.message);
}

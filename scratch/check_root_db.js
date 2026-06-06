const Database = require('better-sqlite3');
const path = require('path');

const dbPath = 'd:\\mymuayy\\dev.db';
console.log('Connecting to root database at:', dbPath);

try {
  const db = new Database(dbPath);
  const categories = db.prepare('SELECT * FROM Category').all();
  console.log('--- Categories in Root DB ---');
  console.log(categories);
  
  const products = db.prepare('SELECT * FROM Product').all();
  console.log('--- Products in Root DB ---');
  products.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.name} | Image: ${p.image} | CategoryId: ${p.categoryId}`);
  });
  db.close();
} catch (err) {
  console.error('Error querying root DB:', err.message);
}

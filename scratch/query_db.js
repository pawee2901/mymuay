const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
console.log('Connecting to database at:', dbPath);
const db = new Database(dbPath);

try {
  const categories = db.prepare('SELECT * FROM Category').all();
  console.log('--- Categories ---');
  console.log(categories);
  
  const products = db.prepare('SELECT * FROM Product').all();
  console.log('--- Products ---');
  products.forEach(p => {
    const stock = db.prepare('SELECT COUNT(*) as cnt FROM StockItem WHERE productId = ? AND isUsed = 0').get(p.id);
    console.log(`ID: ${p.id} | Name: ${p.name} | Price: ${p.price} | CategoryId: ${p.categoryId} | Stock: ${stock.cnt}`);
  });
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new Database(dbPath);

try {
  let output = '';
  const products = ['rov_cat_topup', 'freefire_cat_topup', 'undawn_cat_topup', 'codm_cat_topup', 'deltaforce_cat_topup'];
  for (const pid of products) {
    const options = db.prepare("SELECT * FROM ProductOption WHERE productId = ? ORDER BY position ASC, price ASC").all(pid);
    output += `\n--- ${pid} Options ---\n`;
    options.forEach((opt, idx) => {
      output += `${idx}. ID=${opt.id} | Name=${opt.name} | Price=${opt.price} | AgentPrice=${opt.agentPrice} | Position=${opt.position}\n`;
    });
  }
  fs.writeFileSync(path.resolve(__dirname, 'db_options_dump.txt'), output, 'utf8');
  console.log('Dump completed successfully!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  db.close();
}

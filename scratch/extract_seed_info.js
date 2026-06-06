const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'unlimited_scan_results.txt');
if (!fs.existsSync(filePath)) {
  console.log('unlimited_scan_results.txt does not exist');
  process.exit(0);
}

const content = fs.readFileSync(filePath, 'utf8');
const blocks = content.split('\n========================================\n');

console.log('Analyzing logs blocks...');

blocks.forEach((block) => {
  const lines = block.split('\n');
  const header = lines[0] || '';
  const body = lines.slice(1).join('\n');
  
  // Check if this block contains database seed details
  if (body.includes('Category.create') || body.includes('prisma.category.create') || body.includes('seed') || body.includes('db.prepare') || body.includes('id:') || body.includes('name:')) {
    if (body.includes('Gmail') || body.includes('Canva') || body.includes('ChatGPT') || body.includes('GMAIL')) {
      console.log(`\n--- Block Info: ${header} ---`);
      console.log(body.substring(0, 1500));
      console.log('--------------------------------------------');
    }
  }
});

const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        results = results.concat(searchFiles(filePath));
      }
    } else {
      if (file.endsWith('.db') || file.includes('bak') || file.includes('old') || file.includes('copy')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

console.log('Searching for database files...');
const files = searchFiles('d:\\mymuayy');
console.log('Found database/backup files:', files);

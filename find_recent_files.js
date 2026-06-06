const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walk(filepath, callback);
      }
    } else {
      callback(filepath, stat);
    }
  }
};

const now = Date.now();
const oneHourAgo = now - 60 * 60 * 1000;

console.log('Files modified in the last 1 hour:');
walk('d:\\mymuayy', (filepath, stat) => {
  if (stat.mtimeMs > oneHourAgo) {
    console.log(`- ${filepath} (Modified: ${stat.mtime})`);
  }
});

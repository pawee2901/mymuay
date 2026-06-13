const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  console.log('Modified files:');
  console.log(status);
  fs.writeFileSync(path.resolve(__dirname, 'git_modified.txt'), status, 'utf8');
} catch (err) {
  console.error('Error running git:', err.message);
}

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const diff = execSync('git diff src/components/AdminDashboard.jsx src/components/GameTopupView.jsx', { encoding: 'utf8' });
  fs.writeFileSync(path.resolve(__dirname, 'git_diff_details.txt'), diff, 'utf8');
  console.log('Diff generated successfully!');
} catch (err) {
  console.error('Error running git diff:', err.message);
}

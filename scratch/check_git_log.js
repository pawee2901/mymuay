const { execSync } = require('child_process');
try {
  const commits = execSync('git log -n 5 --oneline', { encoding: 'utf8' });
  console.log('Recent commits:');
  console.log(commits);
} catch (err) {
  console.error('Error running git log:', err.message);
}

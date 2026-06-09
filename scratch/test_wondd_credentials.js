const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const username = env.WONDD_USERNAME;
const password = env.WONDD_PASSWORD;
const apiUrl = env.WONDD_API_URL || 'https://www.wondd.com/member/bot-game.php';

console.log('Testing WonDD credentials...');
console.log('Username:', username);
console.log('API URL:', apiUrl);

if (!username || !password) {
  console.error('Error: WONDD_USERNAME or WONDD_PASSWORD is empty in .env');
  process.exit(1);
}

const bodyParams = new URLSearchParams({
  method: 'balance',
  username: username,
  password: password
});

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: bodyParams.toString()
})
.then(res => res.text())
.then(text => {
  console.log('Raw response:', text);
  try {
    const data = JSON.parse(text);
    if (data.errorcode === '00') {
      console.log('✅ Connection Success!');
      console.log('Balance:', data.balance);
    } else {
      console.log('❌ API Error Code:', data.errorcode);
      console.log('Error Detail:', data.errordetail);
    }
  } catch (e) {
    console.error('Failed to parse JSON response. The server returned:', text);
  }
})
.catch(err => {
  console.error('Network error calling WonDD:', err);
});

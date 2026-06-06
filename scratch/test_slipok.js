const fs = require('fs');
const path = require('path');

// Manually parse .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=\"([^\"]+)\"`, 'm')) || envContent.match(new RegExp(`^${name}=([^\\s]+)`, 'm'));
  return match ? match[1] : null;
};

const apiKey = getEnvVar('SLIPOK_API_KEY');
const branchId = getEnvVar('SLIPOK_BRANCH_ID')?.replace('#', '');

console.log('Parsed credentials:');
console.log('API Key:', apiKey);
console.log('Branch ID:', branchId);

if (!apiKey || !branchId) {
  console.error('Missing credentials in .env file!');
  process.exit(1);
}

// Test call to SlipOk (we can fetch branch details or try an empty call to see if auth header is accepted)
// SlipOk URL: https://api.slipok.com/api/line/apikey/{branchId} with x-authorization header
fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
  method: 'POST',
  headers: {
    'x-authorization': apiKey
  }
}).then(async (res) => {
  const text = await res.text();
  console.log('Status code:', res.status);
  console.log('Response body:', text);
}).catch(err => {
  console.error('Fetch error:', err);
});

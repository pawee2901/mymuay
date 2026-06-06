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

console.log('Sanitized Credentials:');
console.log('API Key:', apiKey, 'Length:', apiKey?.length);
console.log('Branch ID:', branchId, 'Length:', branchId?.length);

if (!apiKey || !branchId) {
  console.error('Missing credentials in .env file!');
  process.exit(1);
}

const quotaUrl = `https://api.slipok.com/api/line/apikey/${branchId}/quota`;
console.log('Calling Quota URL:', quotaUrl);

fetch(quotaUrl, {
  method: 'GET',
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

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

// Find a file in public/uploads to upload
const uploadsDir = path.join(__dirname, '../public/uploads');
const files = fs.readdirSync(uploadsDir);
const imgFile = files.find(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

if (!imgFile) {
  console.error('No upload image found in public/uploads!');
  process.exit(1);
}

const imgPath = path.join(uploadsDir, imgFile);
console.log('Using test image:', imgPath);

// Create FormData payload
// We use the Node FormData if available (Node 18+ has it globally, or we can construct it)
const fileBuffer = fs.readFileSync(imgPath);
// Create a File-like Blob/object
const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });

const formData = new FormData();
formData.append('files', fileBlob, imgFile);
formData.append('log', 'true');

fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
  method: 'POST',
  headers: {
    'x-authorization': apiKey
  },
  body: formData
}).then(async (res) => {
  const data = await res.json();
  console.log('Status code:', res.status);
  console.log('Response body:', JSON.stringify(data, null, 2));
}).catch(err => {
  console.error('Fetch error:', err);
});

const fs = require('fs');
const path = require('path');

const apiKey = 'slipok-5119ca9e-7f0f-4948-b656-9279e48683f6';
const branchId = '68219';

console.log('Testing credentials:');
console.log('API Key:', apiKey);
console.log('Branch ID:', branchId);

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
const fileBuffer = fs.readFileSync(imgPath);
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

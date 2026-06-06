const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e';
const uploadDir = 'd:\\mymuayy\\public\\uploads';

if (!fs.existsSync(brainDir) || !fs.existsSync(uploadDir)) {
  console.log('Folders do not exist');
  process.exit(0);
}

const brainFiles = fs.readdirSync(brainDir).filter(f => f.startsWith('media__') || f.startsWith('uploaded_media_'));
const uploadFiles = fs.readdirSync(uploadDir);

const brainInfos = brainFiles.map(file => {
  const stat = fs.statSync(path.join(brainDir, file));
  return { name: file, size: stat.size };
});

const uploadInfos = uploadFiles.map(file => {
  const stat = fs.statSync(path.join(uploadDir, file));
  return { name: file, size: stat.size };
});

console.log('--- Matching Files by Size ---');
brainInfos.forEach(b => {
  const match = uploadInfos.find(u => Math.abs(u.size - b.size) < 10); // allow small difference
  if (match) {
    console.log(`Brain File: ${b.name} (${b.size} bytes) matches Upload File: /uploads/${match.name} (${match.size} bytes)`);
  } else {
    console.log(`Brain File: ${b.name} (${b.size} bytes) has no size match in uploads.`);
  }
});

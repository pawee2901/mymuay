const fs = require('fs');
const path = require('path');

const uploadDir = 'd:\\mymuayy\\public\\uploads';

if (!fs.existsSync(uploadDir)) {
  console.log('Upload directory does not exist');
  process.exit(0);
}

const files = fs.readdirSync(uploadDir);
const fileInfos = [];

files.forEach((file) => {
  const filePath = path.join(uploadDir, file);
  const stats = fs.statSync(filePath);
  fileInfos.push({
    name: file,
    size: stats.size,
    time: stats.mtime
  });
});

// Sort by time descending (newest first)
fileInfos.sort((a, b) => b.time - a.time);

console.log('--- Uploaded files (Newest first) ---');
fileInfos.forEach((f) => {
  console.log(`File: /uploads/${f.name} | Size: ${f.size} bytes | Time: ${f.time.toISOString()}`);
});

const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';
const uploadDir = 'd:\\mymuayy\\public\\uploads';

if (!fs.existsSync(logPath) || !fs.existsSync(uploadDir)) {
  console.log('Log file or upload directory does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const files = fs.readdirSync(uploadDir);

console.log(`Analyzing first mentions for ${files.length} uploaded files...`);

files.forEach((file) => {
  let foundLine = null;
  let foundStep = -1;
  let foundType = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.includes('scan_all_uploads_info.js') || line.includes('all_upload_mentions.txt') || line.includes('trace_uploads.js')) continue;
    
    if (line.includes(file)) {
      try {
        const data = JSON.parse(line);
        foundLine = line;
        foundStep = data.step_index;
        foundType = data.type;
        break;
      } catch (err) {}
    }
  }
  
  if (foundLine) {
    console.log(`\n========================================`);
    console.log(`File: ${file} | First Mentioned at Step ${foundStep} (Type: ${foundType})`);
    console.log(`----------------------------------------`);
    // Print around the filename
    const idx = foundLine.indexOf(file);
    console.log(foundLine.substring(Math.max(0, idx - 150), Math.min(foundLine.length, idx + 250)));
  } else {
    console.log(`File: ${file} | Not found in JSON logs.`);
  }
});

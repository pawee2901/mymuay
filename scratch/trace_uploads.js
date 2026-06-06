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

console.log(`Tracing references for ${files.length} uploaded files...`);

files.forEach((file) => {
  console.log(`\n====================================`);
  console.log(`Tracing file: ${file}`);
  let count = 0;
  
  lines.forEach((line) => {
    if (!line.trim()) return;
    if (line.includes('trace_uploads.js') || line.includes('read_logs.js') || line.includes('scan_entire_logs_for_urls.js') || line.includes('extract_all_uploads.js')) return;
    
    if (line.includes(file)) {
      count++;
      try {
        const data = JSON.parse(line);
        console.log(`  [Match ${count}] Step ${data.step_index} (Type: ${data.type}):`);
        const idx = line.indexOf(file);
        console.log('    Context:', line.substring(Math.max(0, idx - 120), Math.min(line.length, idx + 200)));
      } catch (err) {
        console.log(`  [Match ${count}] (Parse Error):`);
        const idx = line.indexOf(file);
        console.log('    Context:', line.substring(Math.max(0, idx - 120), Math.min(line.length, idx + 200)));
      }
    }
  });
  console.log(`Total matches for ${file}: ${count}`);
});

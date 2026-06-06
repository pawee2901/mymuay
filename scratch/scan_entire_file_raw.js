const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Scanning raw log file...');

lines.forEach((line, idx) => {
  if (!line.trim()) return;
  if (line.includes('media__') || line.includes('uploaded_')) {
    console.log(`Line ${idx}:`);
    console.log(line.substring(0, 1000));
  }
});

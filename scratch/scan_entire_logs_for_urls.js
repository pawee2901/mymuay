const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Scanning all steps for database image URLs...');

const urls = new Set();
const records = [];

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);
    const text = JSON.stringify(data);
    
    // Scan for urls
    const matches = text.match(/(https?:\/\/[^\s"'`>}]+|\/uploads\/[a-zA-Z0-9\-_.]+)/g);
    if (matches) {
      matches.forEach((url) => {
        // clean url
        const cleanUrl = url.replace(/\\/g, '').replace(/"/g, '').replace(/'/g, '');
        if (cleanUrl.includes('.jpeg') || cleanUrl.includes('.jpg') || cleanUrl.includes('.png') || cleanUrl.includes('.svg') || cleanUrl.includes('/uploads/')) {
          urls.add(cleanUrl);
          records.push({
            step: data.step_index,
            type: data.type,
            url: cleanUrl,
            context: text.substring(Math.max(0, text.indexOf(url) - 100), Math.min(text.length, text.indexOf(url) + 150))
          });
        }
      });
    }
  } catch (err) {}
});

console.log(`\n--- Found ${urls.size} Unique Image URLs in history ---`);
Array.from(urls).forEach(url => console.log('URL:', url));

console.log('\n--- Details of URLs (newest first) ---');
records.reverse().slice(0, 30).forEach((rec) => {
  console.log(`[Step ${rec.step}] URL: ${rec.url}`);
  console.log(`  Context: ${rec.context.replace(/\\n/g, ' ').substring(0, 200)}`);
});
